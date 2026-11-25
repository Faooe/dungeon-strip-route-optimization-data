"""Independent checks for supplementary timing, tie averaging and topology."""
from __future__ import annotations

import csv
import itertools
import json
import math
from collections import Counter

import numpy as np

from phase3_analyze import HERE, PHASE2, graph_data, measures, random_walk, read_rows, with_types
from phase4_optimal_ties import WALK_KEYS


def brute_ties(game_map):
    nodes, _, routes, starts, positions, base = graph_data(game_map)
    perms = [sorted(set(itertools.permutations(base[pos].tolist()))) for pos in positions]
    best = None
    walks = []
    for product in itertools.product(*perms):
        codes = base.copy()
        for pos, values in zip(positions, product):
            codes[pos] = values
        minimum, gap, risk, unique, _, _ = measures(codes[None, :], routes, starts)
        key = (int(minimum[0]), -int(gap[0]), -int(risk[0]), int(unique[0]))
        if best is None or key > best:
            best = key
            walks = []
        if key == best:
            walk = random_walk(with_types(game_map, nodes, codes))
            walks.append([walk[k] for k in WALK_KEYS])
    return len(walks), np.mean(walks, axis=0)


def reachable(game_map, start):
    nodes = {n['id']: n for layer in game_map for n in layer}
    seen, stack = set(), [game_map[0][start]['id']]
    while stack:
        node = stack.pop()
        if node in seen:
            continue
        seen.add(node)
        stack.extend(nodes[node]['next'])
    return seen


def main():
    batches = read_rows(PHASE2 / 'phase2_test' / 'maps.jsonl')
    tie_rows = {r['seed_input']: r for r in csv.DictReader(
        (HERE / 'phase4_optimal_ties_per_seed.csv').open(encoding='utf-8', newline=''))}
    tested = []
    for seed, group in batches.items():
        if int(tie_rows[seed]['optimal_tie_count']) > 0:
            space = math.prod(len(set(itertools.permutations(
                [n['type'] for n in layer]))) for layer in group['original']['map'][1:5])
            if space <= 144:
                count, average = brute_ties(group['original']['map'])
                assert count == int(tie_rows[seed]['optimal_tie_count'])
                assert np.allclose(average, [float(tie_rows[seed][k + '_tie_mean']) for k in WALK_KEYS])
                tested.append(seed)
                if len(tested) == 8:
                    break

    exact_rows = {r['seed_input']: r for r in csv.DictReader(
        (HERE / 'exhaustive_per_seed.csv').open(encoding='utf-8', newline=''))}
    no_shared = 0
    for seed, group in batches.items():
        row = exact_rows[seed]
        if int(row['peti_toko_count']) != 1 or int(row['exact_minimum']) != 0:
            continue
        game_map = group['original']['map']
        layer = next(i for i, nodes in enumerate(game_map)
                     if any(n['type'] in ('peti', 'toko') for n in nodes))
        common = reachable(game_map, 0) & reachable(game_map, 1)
        assert not any(n['id'] in common for n in game_map[layer])
        no_shared += 1
    assert no_shared == 62

    baseline = read_rows(PHASE2 / 'phase2_test' / 'maps.jsonl')
    replicate = read_rows(HERE / 'phase4_timing_methods' / 'maps.jsonl')
    assert set(baseline) == set(replicate)
    for seed in baseline:
        for method in baseline[seed]:
            for field in ('map', 'metrics', 'evaluations', 'source_sha256'):
                assert baseline[seed][method][field] == replicate[seed][method][field]
    timing = list(csv.DictReader((HERE / 'phase4_node_enumeration_per_seed.csv').open(encoding='utf-8', newline='')))
    assert len(timing) == 1000
    assert sum(int(r['evaluations']) for r in timing) == 3787236

    result = {'status': 'passed', 'independent_tie_seed_count': len(tested),
              'independent_tie_seed_inputs': tested, 'zero_reward_topology_seeds': no_shared,
              'repeated_phase2_maps_checked': 4000, 'node_exact_seeds_checked': len(timing)}
    (HERE / 'phase4_validation.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
