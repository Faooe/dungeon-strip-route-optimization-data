"""Supplementary restart sensitivity using only the 90 development seeds.

Derives temporary copies of the frozen phase-2 script with only the restart
count changed. The originals and test-seed outcomes are not modified.
"""
from __future__ import annotations

import csv
import json
import os
import statistics as st
import subprocess
import tempfile
from pathlib import Path

from phase3_analyze import HERE, PHASE2, exhaustive, metric_tuple, read_rows

NODE = os.environ.get('NODE_EXECUTABLE', 'node')
SCRIPT = PHASE2 / 'phase2.mjs'
SNAPSHOT = PHASE2 / 'phase2_test' / 'logika_snapshot.js'
COUNTS = (1, 2, 3, 4, 8)


def main():
    original = SCRIPT.read_text(encoding='utf-8')
    assert original.count('restart < 4') == 1
    assert original.count('local_swap_restarts:4') == 1
    archive_one = read_rows(PHASE2 / 'phase2_dev_one_start' / 'maps.jsonl')
    archive_four = read_rows(PHASE2 / 'phase2_dev' / 'maps.jsonl')
    exact = {}
    for seed, group in archive_four.items():
        _, _, metric, _ = exhaustive(group['original']['map'])
        exact[seed] = metric
    all_rows = []
    with tempfile.TemporaryDirectory(prefix='phase4_tuning_') as tmp:
        tmp = Path(tmp)
        for count in COUNTS:
            derived = original.replace('restart < 4', f'restart < {count}')
            derived = derived.replace('local_swap_restarts:4', f'local_swap_restarts:{count}')
            script = tmp / f'phase2_restart_{count}.mjs'
            script.write_text(derived, encoding='utf-8')
            out = tmp / f'run_{count}'
            subprocess.run([NODE, str(script), '--source', str(SNAPSHOT),
                            '--count', '90', '--start', '2023-10-01', '--out', str(out)],
                           check=True, stdout=subprocess.DEVNULL)
            batches = read_rows(out / 'maps.jsonl')
            assert set(batches) == set(archive_four) == set(archive_one)
            if count in (1, 4):
                reference = archive_one if count == 1 else archive_four
                for seed in batches:
                    got = batches[seed]['local_swap_repair']
                    old = reference[seed]['local_swap_repair']
                    assert got['metrics'] == old['metrics']
                    assert got['evaluations'] == old['evaluations']
            for seed, group in batches.items():
                row = group['local_swap_repair']
                metric = row['metrics']
                all_rows.append({
                    'restart_count': count, 'seed_input': seed,
                    'minimum_best_reward': metric['minimum_best_reward'],
                    'reward_gap': metric['reward_gap'],
                    'worst_risk_streak': metric['worst_risk_streak'],
                    'unique_path_share': metric['unique_path_share'],
                    'evaluations': row['evaluations'],
                    'optimal_first_two': int(metric_tuple(metric)[:2] == metric_tuple(exact[seed])[:2]),
                    'optimal_all_four': int(metric_tuple(metric) == metric_tuple(exact[seed])),
                })
            print(f'Development restart count {count}: 90 seeds', flush=True)
    with (HERE / 'phase4_tuning_per_seed.csv').open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(all_rows[0]))
        writer.writeheader()
        writer.writerows(all_rows)
    result = {}
    for count in COUNTS:
        rows = [r for r in all_rows if r['restart_count'] == count]
        result[str(count)] = {
            'seed_count': len(rows),
            'mean_minimum_best_reward': st.mean(r['minimum_best_reward'] for r in rows),
            'mean_reward_gap': st.mean(r['reward_gap'] for r in rows),
            'mean_evaluations': st.mean(r['evaluations'] for r in rows),
            'optimal_first_two': sum(r['optimal_first_two'] for r in rows),
            'optimal_all_four': sum(r['optimal_all_four'] for r in rows),
        }
    (HERE / 'phase4_tuning_summary.json').write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
