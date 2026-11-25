"""Audit every four-objective optimum and its uniformly branching walk metrics.

Each seed contributes equally to reported means; tied placements are averaged
within seed first. This script never changes the recorded phase-2 maps.
"""
from __future__ import annotations

import csv
import itertools
import json
import math
from pathlib import Path

import numpy as np

from phase3_analyze import (HERE, PHASE2, REWARD, BATCH, graph_data,
                            measures, read_rows, stats)

WALK_KEYS = ('encounter_left', 'encounter_right', 'encounter_minimum',
             'expected_left', 'expected_right', 'expected_minimum')


def walk_batch(codes, nodes, indices):
    reward = np.isin(codes, REWARD)
    n = len(codes)
    expected = np.zeros((n, len(nodes)), dtype=np.float64)
    no_reward = np.ones((n, len(nodes)), dtype=np.float64)
    for i in range(len(nodes) - 1, -1, -1):
        children = [indices[k] for k in nodes[i]['next']]
        if children:
            expected[:, i] = reward[:, i] + expected[:, children].mean(axis=1)
            no_reward[:, i] = (~reward[:, i]) * no_reward[:, children].mean(axis=1)
        else:
            expected[:, i] = reward[:, i]
            no_reward[:, i] = ~reward[:, i]
    left, right = 1 - no_reward[:, 0], 1 - no_reward[:, 1]
    el, er = expected[:, 0], expected[:, 1]
    return np.column_stack((left, right, np.minimum(left, right),
                            el, er, np.minimum(el, er)))


def one_seed(game_map):
    nodes, indices, routes, starts, positions, base = graph_data(game_map)
    perms = [np.array(sorted(set(itertools.permutations(base[pos].tolist()))),
                      dtype=np.uint8) for pos in positions]
    sizes = [len(p) for p in perms]
    space = math.prod(sizes)
    product = itertools.product(*(range(k) for k in sizes))
    best = None
    count = 0
    sums = np.zeros(6, dtype=np.float64)
    lows = np.full(6, np.inf)
    highs = np.full(6, -np.inf)
    evaluated = 0
    while choices := list(itertools.islice(product, BATCH)):
        choices = np.asarray(choices, dtype=np.intp)
        candidates = np.tile(base, (len(choices), 1))
        for layer, pos in enumerate(positions):
            candidates[:, pos] = perms[layer][choices[:, layer]]
        minimum, gap, risk, unique, _, _ = measures(candidates, routes, starts)
        prior_best = best
        selected = []
        for i in range(len(choices)):
            key = (int(minimum[i]), -int(gap[i]), -int(risk[i]), int(unique[i]))
            if best is None or key > best:
                best = key
                selected = [i]
            elif key == best:
                selected.append(i)
        # A better key later in this batch invalidates earlier tied candidates.
        # Track the global best before the batch so older batches are reset.
        if best != prior_best:
            count = 0
            sums[:] = 0
            lows[:] = np.inf
            highs[:] = -np.inf
        if selected:
            metrics = walk_batch(candidates[np.asarray(selected, dtype=np.intp)], nodes, indices)
            count += len(metrics)
            sums += metrics.sum(axis=0)
            lows = np.minimum(lows, metrics.min(axis=0))
            highs = np.maximum(highs, metrics.max(axis=0))
        evaluated += len(choices)
    assert evaluated == space and count >= 1
    return space, best, count, sums / count, lows, highs


def main():
    batches = read_rows(PHASE2 / 'phase2_test' / 'maps.jsonl')
    old = {r['seed_input']: r for r in csv.DictReader(
        (HERE / 'exhaustive_per_seed.csv').open(encoding='utf-8', newline=''))}
    rows = []
    for serial, (seed, group) in enumerate(batches.items(), 1):
        space, key, count, average, low, high = one_seed(group['original']['map'])
        prior = old[seed]
        assert space == int(prior['search_space'])
        assert key[0] == int(prior['exact_minimum'])
        assert -key[1] == int(prior['exact_gap'])
        assert -key[2] == int(prior['exact_risk'])
        assert math.isclose(key[3] / int(prior['path_count']),
                            float(prior['exact_unique_share']), abs_tol=1e-12)
        row = {'id': f'U{serial:04d}', 'seed_input': seed, 'optimal_tie_count': count}
        for i, label in enumerate(WALK_KEYS):
            row[label + '_tie_mean'] = float(average[i])
            row[label + '_tie_min'] = float(low[i])
            row[label + '_tie_max'] = float(high[i])
        rows.append(row)
        if serial % 100 == 0:
            print(f'Ties: {serial}/1000 seeds', flush=True)
    path = HERE / 'phase4_optimal_ties_per_seed.csv'
    with path.open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    summary = {
        'seed_count': len(rows),
        'ties_per_seed': stats([r['optimal_tie_count'] for r in rows]),
        'seeds_with_ties': sum(r['optimal_tie_count'] > 1 for r in rows),
        'tie_averaged_walk': {k: stats([r[k + '_tie_mean'] for r in rows]) for k in WALK_KEYS},
        'across_tie_minimum': {k: stats([r[k + '_tie_min'] for r in rows]) for k in WALK_KEYS},
        'across_tie_maximum': {k: stats([r[k + '_tie_max'] for r in rows]) for k in WALK_KEYS},
    }
    (HERE / 'phase4_optimal_ties_summary.json').write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)


if __name__ == '__main__':
    main()
