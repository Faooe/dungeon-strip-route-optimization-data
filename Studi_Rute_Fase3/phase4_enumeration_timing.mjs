// Node.js timing of the exact search using the frozen phase-2 evaluator.
// The phase-2 script and source snapshot are read, never modified.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const phase2Candidates = ['../Dungeon_Strip_Studi_Rute_Fase2', '../Studi_Rute_Fase2'];
const phase2 = phase2Candidates.map(item => path.resolve(here, item))
  .find(item => fs.existsSync(path.join(item, 'phase2.mjs')));
assert(phase2, 'Phase-2 data folder was not found');
const source = fs.readFileSync(path.join(phase2, 'phase2_test/logika_snapshot.js'), 'utf8');
const phase2Code = fs.readFileSync(path.join(phase2, 'phase2.mjs'), 'utf8');
const cut = (text, begin, end) => {
  const a = text.indexOf(begin), b = text.indexOf(end, a);
  assert(a >= 0 && b > a, `Missing source segment: ${begin}`);
  return text.slice(a, b);
};
const buatPeta = vm.runInNewContext(
  `${cut(source, 'function acakHarian(', 'const nodeDari=')}\nbuatPeta`,
  { rnd: Math.random });
const REWARD = new Set(['peti', 'toko']);
const HIGH_RISK = new Set(['elit', 'tantangan']);
const evaluator = new Function('assert', 'REWARD', 'HIGH_RISK',
  cut(phase2Code, 'function prepare(map)', 'function baselineGenome(p)') + '\n' +
  cut(phase2Code, 'function measure(p, genome)', 'function preferred(') + '\n' +
  'return {prepare, measure, objectives};');
const { prepare, measure, objectives } = evaluator(assert, REWARD, HIGH_RISK);

function uniquePermutations(p, positions) {
  const counts = new Map();
  const representatives = new Map();
  for (const index of positions) {
    const type = p.tokenTypes[index];
    counts.set(type, (counts.get(type) || 0) + 1);
    representatives.set(type, index);
  }
  const types = [...counts.keys()].sort();
  const result = [], current = [];
  function visit() {
    if (current.length === positions.length) {
      result.push(current.map(type => representatives.get(type)));
      return;
    }
    for (const type of types) {
      if (!counts.get(type)) continue;
      counts.set(type, counts.get(type) - 1);
      current.push(type);
      visit();
      current.pop();
      counts.set(type, counts.get(type) + 1);
    }
  }
  visit();
  return result;
}

function better(a, b) {
  if (b === null) return true;
  const x = objectives(a), y = objectives(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

function exact(seed) {
  const t0 = performance.now();
  const p = prepare(buatPeta(seed));
  const permutations = p.layers.map(layer => uniquePermutations(p, layer));
  const genome = p.nodes.map((_, i) => i);
  let best = null, count = 0;
  function visit(layer) {
    if (layer === 4) {
      const candidate = measure(p, genome);
      count++;
      if (better(candidate, best)) best = candidate;
      return;
    }
    const positions = p.layers[layer];
    for (const tokens of permutations[layer]) {
      positions.forEach((position, i) => { genome[position] = tokens[i]; });
      visit(layer + 1);
    }
  }
  visit(0);
  return { elapsed_ms: performance.now() - t0, evaluations: count, metrics: best };
}

const limitIndex = process.argv.indexOf('--limit');
const limit = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : 1000;
assert(Number.isInteger(limit) && limit > 0 && limit <= 1000);
const original = fs.readFileSync(path.join(phase2, 'phase2_test/maps.jsonl'), 'utf8')
  .trim().split(/\r?\n/).map(JSON.parse).filter(row => row.method === 'original').slice(0, limit);
// Check header positions before use; CSV contains no quoted commas.
const header = fs.readFileSync(path.join(here, 'exhaustive_per_seed.csv'), 'utf8').split(/\r?\n/)[0].split(',');
const rows = fs.readFileSync(path.join(here, 'exhaustive_per_seed.csv'), 'utf8').trim().split(/\r?\n/).slice(1);
const audit = new Map(rows.map(line => {
  const cells = line.split(',');
  const get = name => cells[header.indexOf(name)];
  return [get('seed_input'), {
    space: Number(get('search_space')), minimum: Number(get('exact_minimum')),
    gap: Number(get('exact_gap')), risk: Number(get('exact_risk')),
    unique: Number(get('exact_unique_share'))}];
}));

// Warm the same evaluator without including it in recorded times.
for (const row of original.slice(0, Math.min(30, original.length))) exact(row.seed);
const results = [];
for (let i = 0; i < original.length; i++) {
  const seed = original[i].seed;
  const result = exact(seed);
  const control = audit.get(seed);
  assert(control, `Unknown seed ${seed}`);
  assert.equal(result.evaluations, control.space);
  assert.equal(result.metrics.minimum_best_reward, control.minimum);
  assert.equal(result.metrics.reward_gap, control.gap);
  assert.equal(result.metrics.worst_risk_streak, control.risk);
  assert(Math.abs(result.metrics.unique_path_share - control.unique) < 1e-12);
  results.push({ seed, evaluations: result.evaluations, elapsed_ms: result.elapsed_ms });
  if ((i + 1) % 100 === 0) console.log(`Node enumeration: ${i + 1}/${original.length}`);
}
const times = results.map(r => r.elapsed_ms).sort((a, b) => a - b);
const quantile = q => {
  const v = (times.length - 1) * q, lo = Math.floor(v), hi = Math.ceil(v);
  return times[lo] + (times[hi] - times[lo]) * (v - lo);
};
const summary = {
  seed_count: results.length, total_evaluations: results.reduce((s, r) => s + r.evaluations, 0),
  mean_ms: times.reduce((s, t) => s + t, 0) / times.length,
  median_ms: quantile(0.5), p05_ms: quantile(0.05), p95_ms: quantile(0.95),
  node_version: process.version, source_sha256: crypto.createHash('sha256').update(source).digest('hex'),
  phase2_sha256: crypto.createHash('sha256').update(phase2Code).digest('hex'),
  timing_includes: 'buatPeta(seed), prepare(map), unique permutation construction, exhaustive evaluation',
  validation: 'all exact metrics and search-space sizes match Python phase-3 audit',
};
if (limit === 1000) {
  fs.writeFileSync(path.join(here, 'phase4_node_enumeration_per_seed.csv'),
    'seed_input,evaluations,elapsed_ms\n' + results.map(r => `${r.seed},${r.evaluations},${r.elapsed_ms}`).join('\n') + '\n');
  fs.writeFileSync(path.join(here, 'phase4_node_enumeration_summary.json'), JSON.stringify(summary, null, 2));
}
console.log(JSON.stringify(summary, null, 2));
