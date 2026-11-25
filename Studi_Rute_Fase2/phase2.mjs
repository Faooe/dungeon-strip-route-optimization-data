import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';

// Read the two functions used by the released game. No copied approximation of
// the baseline generator is used in this experiment.
const cliArgs = process.argv.slice(2);
const getArg = (flag, fallback) => { const i = cliArgs.indexOf(flag); return i < 0 ? fallback : cliArgs[i+1]; };
const sourcePath = getArg('--source', process.env.DUNGEON_SOURCE || './Studi_Rute_Fase2/phase2_test/logika_snapshot.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const sourceSha256 = crypto.createHash('sha256').update(source).digest('hex');
const begin = source.indexOf('function acakHarian(');
const end = source.indexOf('const nodeDari=', begin);
assert(begin >= 0 && end > begin, 'Released route generator not found');
const snippet = source.slice(begin, end);
assert(snippet.includes('function buatPeta(seed)'), 'Unexpected generator signature');
const buatPeta = vm.runInNewContext(`${snippet}\nbuatPeta`, { rnd: Math.random });

const POP = 24;
const GENERATIONS = 30;
const CANDIDATES = POP * (GENERATIONS + 1);
const REWARD = new Set(['peti', 'toko']);
const HIGH_RISK = new Set(['elit', 'tantangan']);
const OBJECTIVES = ['minimum_best_reward', 'negative_reward_gap', 'negative_worst_risk_streak', 'unique_path_share'];

function seededRng(seed) {
  let x = seed >>> 0;
  return () => {
    x += 0x6D2B79F5;
    let y = x;
    y = Math.imul(y ^ (y >>> 15), y | 1);
    y ^= y + Math.imul(y ^ (y >>> 7), y | 61);
    return ((y ^ (y >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(text) {
  return crypto.createHash('sha256').update(text).digest().readUInt32LE(0);
}
function shuffled(a, rng) {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function dates(startIso, count) {
  const start = Date.parse(startIso + 'T00:00:00Z');
  assert(Number.isFinite(start), 'Invalid start date');
  return Array.from({ length: count }, (_, i) => new Date(start + i * 86400000).toISOString().slice(0, 10));
}
function prepare(map) {
  const nodes = map.flat();
  const idToIndex = new Map(nodes.map((n, i) => [n.id, i]));
  const tokenTypes = nodes.map(n => n.t);
  const layers = [1, 2, 3, 4].map(i => map[i].map(n => idToIndex.get(n.id)));
  const paths = [];
  function walk(index, indices, start) {
    const n = nodes[index];
    const next = [...indices, index];
    if (n.lapis === map.length - 1) {
      paths.push({ indices: next, start });
      return;
    }
    for (const id of n.ke) walk(idToIndex.get(id), next, start);
  }
  map[0].forEach((n, start) => walk(idToIndex.get(n.id), [], start));
  assert(paths.length > 0);
  return { map, nodes, layers, tokenTypes, paths };
}
function typesOf(p, genome) {
  return genome.map(token => p.tokenTypes[token]);
}
function baselineGenome(p) {
  return p.nodes.map((_, i) => i);
}
function randomGenome(p, rng) {
  const g = baselineGenome(p);
  for (const layer of p.layers) {
    const s = shuffled(layer, rng);
    layer.forEach((position, j) => { g[position] = s[j]; });
  }
  return g;
}
function crossover(p, a, b, rng) {
  const child = [...a];
  for (const layer of p.layers) {
    const n = layer.length;
    const lo = Math.floor(rng() * n);
    const hi = lo + Math.floor(rng() * (n - lo));
    const A = layer.map(i => a[i]);
    const B = layer.map(i => b[i]);
    const out = Array(n).fill(-1);
    const used = new Set();
    for (let i = lo; i <= hi; i++) { out[i] = A[i]; used.add(A[i]); }
    let cursor = (hi + 1) % n;
    for (let step = 0; step < n; step++) {
      const token = B[(hi + 1 + step) % n];
      if (used.has(token)) continue;
      out[cursor] = token;
      cursor = (cursor + 1) % n;
    }
    assert(out.every(x => x >= 0));
    layer.forEach((position, i) => { child[position] = out[i]; });
  }
  return child;
}
function mutate(p, genome, rng) {
  const out = [...genome];
  const layer = p.layers[Math.floor(rng() * p.layers.length)];
  const i = Math.floor(rng() * layer.length);
  let j = Math.floor(rng() * (layer.length - 1));
  if (j >= i) j++;
  [out[layer[i]], out[layer[j]]] = [out[layer[j]], out[layer[i]]];
  return out;
}
function validateGenome(p, g) {
  assert.equal(g.length, p.nodes.length);
  for (const layer of p.layers) {
    assert.deepEqual(shuffled(layer.map(i => g[i]), () => 0.5).sort((a,b)=>a-b), [...layer].sort((a,b)=>a-b));
  }
}
function measure(p, genome) {
  const types = typesOf(p, genome);
  const bestRewardByStart = Array(p.map[0].length).fill(-Infinity);
  let worstRiskStreak = 0;
  const signatures = new Set();
  let pathsWithReward = 0;
  for (const route of p.paths) {
    let rewards = 0, streak = 0;
    const sig = [];
    for (const index of route.indices) {
      const type = types[index];
      sig.push(type);
      if (REWARD.has(type)) rewards++;
      streak = HIGH_RISK.has(type) ? streak + 1 : 0;
      if (streak > worstRiskStreak) worstRiskStreak = streak;
    }
    if (rewards > 0) pathsWithReward++;
    bestRewardByStart[route.start] = Math.max(bestRewardByStart[route.start], rewards);
    signatures.add(sig.join('/'));
  }
  const minimumBestReward = Math.min(...bestRewardByStart);
  const rewardGap = Math.max(...bestRewardByStart) - minimumBestReward;
  const uniquePathShare = signatures.size / p.paths.length;
  return {
    minimum_best_reward: minimumBestReward,
    reward_gap: rewardGap,
    worst_risk_streak: worstRiskStreak,
    unique_path_share: uniquePathShare,
    paths_with_reward_share: pathsWithReward / p.paths.length,
    path_count: p.paths.length,
    best_reward_by_start: bestRewardByStart,
  };
}
function objectives(m) {
  return [m.minimum_best_reward, -m.reward_gap, -m.worst_risk_streak, m.unique_path_share];
}
function preferred(a, b) {
  // Prespecified final-map choice among Pareto candidates. Prefer guaranteed
  // opportunities first, then smaller disparity and risk streak, then variety.
  const x = objectives(a.metrics), y = objectives(b.metrics);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] > y[i] ? a : b;
  return a;
}
function dominates(a, b) {
  const x = objectives(a.metrics), y = objectives(b.metrics);
  return x.every((v, i) => v >= y[i]) && x.some((v, i) => v > y[i]);
}
function sortFronts(pop) {
  const dominated = pop.map(() => []);
  const count = pop.map(() => 0);
  const fronts = [[]];
  for (let i = 0; i < pop.length; i++) {
    for (let j = i + 1; j < pop.length; j++) {
      if (dominates(pop[i], pop[j])) { dominated[i].push(j); count[j]++; }
      else if (dominates(pop[j], pop[i])) { dominated[j].push(i); count[i]++; }
    }
  }
  for (let i = 0; i < pop.length; i++) if (!count[i]) { pop[i].rank = 0; fronts[0].push(i); }
  let rank = 0;
  while (fronts[rank].length) {
    const next = [];
    for (const i of fronts[rank]) for (const j of dominated[i]) {
      count[j]--;
      if (!count[j]) { pop[j].rank = rank + 1; next.push(j); }
    }
    rank++;
    fronts.push(next);
  }
  for (const front of fronts) {
    if (!front.length) continue;
    front.forEach(i => { pop[i].crowding = 0; });
    for (let k = 0; k < OBJECTIVES.length; k++) {
      const ordered = [...front].sort((i,j) => objectives(pop[i].metrics)[k] - objectives(pop[j].metrics)[k]);
      pop[ordered[0]].crowding = Infinity;
      pop[ordered[ordered.length-1]].crowding = Infinity;
      const min = objectives(pop[ordered[0]].metrics)[k];
      const max = objectives(pop[ordered[ordered.length-1]].metrics)[k];
      if (max === min) continue;
      for (let v = 1; v < ordered.length - 1; v++)
        pop[ordered[v]].crowding += (objectives(pop[ordered[v+1]].metrics)[k] - objectives(pop[ordered[v-1]].metrics)[k]) / (max - min);
    }
  }
  return fronts;
}
function select(pop, size) {
  const fronts = sortFronts(pop);
  const out = [];
  for (const front of fronts) {
    if (!front.length || out.length === size) break;
    const members = front.map(i => pop[i]);
    members.sort((a,b) => b.crowding - a.crowding);
    out.push(...members.slice(0, size - out.length));
  }
  assert.equal(out.length, size);
  return out;
}
function tournament(pop, rng) {
  const a = pop[Math.floor(rng() * pop.length)];
  const b = pop[Math.floor(rng() * pop.length)];
  if (a.rank !== b.rank) return a.rank < b.rank ? a : b;
  return a.crowding >= b.crowding ? a : b;
}
function candidate(p, genome) { return { genome, metrics: measure(p, genome) }; }
function optimizeGa(p, seed) {
  const rng = seededRng(hashSeed(seed + ':ga'));
  let population = [candidate(p, baselineGenome(p))];
  while (population.length < POP) population.push(candidate(p, randomGenome(p, rng)));
  let evaluations = population.length;
  population = select(population, POP);
  for (let generation = 0; generation < GENERATIONS; generation++) {
    const offspring = [];
    while (offspring.length < POP) {
      let genome = crossover(p, tournament(population,rng).genome, tournament(population,rng).genome, rng);
      if (rng() < 0.8) genome = mutate(p, genome, rng);
      offspring.push(candidate(p, genome));
    }
    evaluations += offspring.length;
    population = select([...population, ...offspring], POP);
  }
  assert.equal(evaluations, CANDIDATES);
  let best = population[0];
  for (const c of population.slice(1)) best = preferred(best, c);
  return { ...best, evaluations };
}
function optimizeRandom(p, seed) {
  const rng = seededRng(hashSeed(seed + ':random-search'));
  let best = candidate(p, baselineGenome(p));
  for (let i = 1; i < CANDIDATES; i++) best = preferred(best, candidate(p, randomGenome(p, rng)));
  return { ...best, evaluations: CANDIDATES };
}
function better(a, b) {
  const x = objectives(a.metrics), y = objectives(b.metrics);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}
function optimizeLocal(p, seed) {
  // Four deterministic starts (original plus three seeded shuffles), each
  // repaired by best-improvement swaps until a local optimum or ten steps.
  const rng = seededRng(hashSeed(seed + ':local-repair'));
  let globalBest = null, evaluations = 0;
  for (let restart = 0; restart < 4; restart++) {
    let current = candidate(p, restart === 0 ? baselineGenome(p) : randomGenome(p,rng));
    evaluations++;
    for (let step = 0; step < 10; step++) {
      let best = current;
      const types = typesOf(p, current.genome);
      for (const layer of p.layers) for (let i = 0; i < layer.length; i++)
        for (let j = i + 1; j < layer.length; j++) {
          if (types[layer[i]] === types[layer[j]]) continue;
          const genome = [...current.genome];
          [genome[layer[i]],genome[layer[j]]] = [genome[layer[j]],genome[layer[i]]];
          const next = candidate(p, genome);
          evaluations++;
          if (better(next,best)) best = next;
        }
      if (!better(best,current)) break;
      current = best;
    }
    if (globalBest === null || better(current,globalBest)) globalBest = current;
  }
  return { ...globalBest, evaluations };
}
function serializeMap(p, genome) {
  const types = typesOf(p, genome);
  let index = 0;
  return p.map.map(layer => layer.map(n => ({ id: n.id, type: types[index++], next: n.ke })));
}
function mean(a) { return a.reduce((s,x)=>s+x,0)/a.length; }
function quantile(a, q) {
  const s = [...a].sort((x,y)=>x-y);
  const v = (s.length - 1) * q, lo = Math.floor(v), hi = Math.ceil(v);
  return s[lo] + (s[hi] - s[lo]) * (v - lo);
}
function summarize(rows) {
  const methods = ['original','random_search','genetic_algorithm','local_swap_repair'];
  const metrics = ['minimum_best_reward','reward_gap','worst_risk_streak','unique_path_share','paths_with_reward_share','generation_ms'];
  const out = { method: {}, paired_difference_ga_minus_original: {}, paired_difference_ga_minus_random_search: {}, paired_difference_local_minus_original: {}, paired_difference_local_minus_random_search: {}, paired_difference_local_minus_ga: {} };
  for (const method of methods) {
    const group = rows.filter(r => r.method === method);
    out.method[method] = {};
    for (const key of metrics) {
      const a = group.map(r => key === 'generation_ms' ? r.generation_ms : r.metrics[key]);
      out.method[method][key] = { mean: mean(a), median: quantile(a,.5), p05: quantile(a,.05), p95: quantile(a,.95) };
    }
  }
  const bySeed = new Map();
  for (const r of rows) {
    if (!bySeed.has(r.seed)) bySeed.set(r.seed, {});
    bySeed.get(r.seed)[r.method] = r;
  }
  for (const [label,first,other] of [
    ['paired_difference_ga_minus_original','genetic_algorithm','original'],
    ['paired_difference_ga_minus_random_search','genetic_algorithm','random_search'],
    ['paired_difference_local_minus_original','local_swap_repair','original'],
    ['paired_difference_local_minus_random_search','local_swap_repair','random_search'],
    ['paired_difference_local_minus_ga','local_swap_repair','genetic_algorithm'],
  ]) {
    for (const key of metrics) {
      const diffs = [...bySeed.values()].map(x => (key === 'generation_ms' ? x[first].generation_ms - x[other].generation_ms : x[first].metrics[key] - x[other].metrics[key]));
      const rng = seededRng(hashSeed(label + key));
      const boots = [];
      for (let b = 0; b < 2000; b++) {
        let sum = 0;
        for (let i = 0; i < diffs.length; i++) sum += diffs[Math.floor(rng()*diffs.length)];
        boots.push(sum/diffs.length);
      }
      out[label][key] = { mean_difference: mean(diffs), bootstrap95: [quantile(boots,.025),quantile(boots,.975)], positive_share: diffs.filter(x=>x>0).length/diffs.length, equal_share: diffs.filter(x=>x===0).length/diffs.length };
    }
  }
  return out;
}
function selfCheck() {
  const map = buatPeta('2020-01-01');
  assert.deepEqual(map, buatPeta('2020-01-01'), 'Baseline daily map must be reproducible');
  const p = prepare(map);
  const g = baselineGenome(p);
  validateGenome(p, g);
  const rng = seededRng(42);
  const a = randomGenome(p, rng), b = randomGenome(p, rng);
  validateGenome(p, a); validateGenome(p, b);
  validateGenome(p, crossover(p, a, b, rng));
  validateGenome(p, mutate(p, a, rng));
  validateGenome(p, optimizeLocal(p,'2020-01-01').genome);
  assert(p.paths.every(route => route.indices.length === 7 && p.nodes[route.indices.at(-1)].t === 'bos'));
  assert.equal(measure(p,g).path_count, p.paths.length);
  console.log('Self-check passed');
}
function main() {
  if (cliArgs.includes('--self-check')) return selfCheck();
  const count = Number(getArg('--count', '50'));
  const start = getArg('--start', '2020-01-01');
  const outDir = path.resolve(getArg('--out', './result'));
  assert(Number.isInteger(count) && count > 0 && count <= 10000);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'logika_snapshot.js'), source);
  const rows = [], output = fs.createWriteStream(path.join(outDir, 'maps.jsonl'), { encoding: 'utf8' });
  const seedList = dates(start,count);
  const tAll = performance.now();
  for (const seed of seedList) {
    const t0 = performance.now();
    const map = buatPeta(seed), p = prepare(map);
    const baselineMs = performance.now() - t0;
    const original = candidate(p, baselineGenome(p));
    const jobs = [
      ['random_search',()=>optimizeRandom(p,seed)],
      ['genetic_algorithm',()=>optimizeGa(p,seed)],
      ['local_swap_repair',()=>optimizeLocal(p,seed)],
    ];
    const completed = {original:{c:original,ms:baselineMs}};
    const offset = hashSeed(seed+':execution-order') % jobs.length;
    for (let j = 0; j < jobs.length; j++) {
      const [method,run] = jobs[(j+offset)%jobs.length];
      const t = performance.now(), c = run();
      completed[method] = {c,ms:baselineMs+performance.now()-t};
    }
    for (const method of ['original','random_search','genetic_algorithm','local_swap_repair']) {
      const {c,ms} = completed[method];
      validateGenome(p,c.genome);
      const row = {seed,method,source_sha256:sourceSha256,generation_ms:ms,evaluations:c.evaluations||1,metrics:c.metrics,map:serializeMap(p,c.genome)};
      output.write(JSON.stringify(row)+'\n');
      rows.push(row);
    }
  }
  output.end();
  const summary = summarize(rows);
  const manifest = {
    study: 'Dungeon Strip seeded route optimization', source_path:sourcePath, source_sha256:sourceSha256,
    generator_sha256:crypto.createHash('sha256').update(snippet).digest('hex'),
    seed_start:start,seed_count:count,seed_end:seedList.at(-1),
    population:POP,generations:GENERATIONS,candidates_per_optimization:CANDIDATES,
    local_swap_restarts:4,local_swap_max_steps_per_start:10,
    scope:'Route graph and room types only; no room layouts, combat outcomes, loot draws or human player experience',
    reward_types:[...REWARD],high_risk_types:[...HIGH_RISK],
    objectives:OBJECTIVES, elapsed_seconds:(performance.now()-tAll)/1000,
    node_version:process.version,created_at_utc:new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2));
  fs.writeFileSync(path.join(outDir,'summary.json'),JSON.stringify(summary,null,2));
  console.log(JSON.stringify({outDir,elapsed_seconds:manifest.elapsed_seconds,summary},null,2));
}
main();
