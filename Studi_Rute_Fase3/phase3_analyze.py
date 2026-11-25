"""Deterministic exhaustive audit and supplementary route metrics for Dungeon Strip.

Run from the workspace root. All input paths are relative to this file. The
enumeration retains topology and each internal layer's room-type multiset.
"""
from __future__ import annotations

import csv
import itertools
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
PHASE2 = HERE.parent / "Dungeon_Strip_Studi_Rute_Fase2"
if not PHASE2.exists():
    PHASE2 = HERE.parent / "Studi_Rute_Fase2"
OUT = HERE
METHODS = ("original", "random_search", "genetic_algorithm", "local_swap_repair")
TYPES = ("tempur", "elit", "tantangan", "peti", "toko", "misteri", "api", "bos")
TYPE_CODE = {v: i for i, v in enumerate(TYPES)}
REWARD = np.array([TYPE_CODE["peti"], TYPE_CODE["toko"]])
RISK = np.array([TYPE_CODE["elit"], TYPE_CODE["tantangan"]])
BOOTSTRAP_SEED = 20261125
BATCH = 2048


def read_rows(path: Path):
    batches = defaultdict(dict)
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            row = json.loads(line)
            assert row["method"] not in batches[row["seed"]]
            batches[row["seed"]][row["method"]] = row
    return dict(sorted(batches.items()))


def metric_tuple(m):
    return (m["minimum_best_reward"], -m["reward_gap"],
            -m["worst_risk_streak"], m["unique_path_share"])


def graph_data(game_map):
    nodes = [node for layer in game_map for node in layer]
    indices = {node["id"]: i for i, node in enumerate(nodes)}
    paths, starts = [], []

    def walk(i, route, start):
        route = route + (i,)
        if not nodes[i]["next"]:
            paths.append(route)
            starts.append(start)
            return
        for nxt in nodes[i]["next"]:
            walk(indices[nxt], route, start)

    for start, node in enumerate(game_map[0]):
        walk(indices[node["id"]], (), start)
    assert len(game_map) == 7 and all(len(route) == 7 for route in paths)
    assert len(paths) > 0 and set(starts) == {0, 1}
    positions = [np.array([indices[n["id"]] for n in game_map[i]], dtype=np.intp)
                 for i in range(1, 5)]
    codes = np.array([TYPE_CODE[n["type"]] for n in nodes], dtype=np.uint8)
    return nodes, indices, np.array(paths, dtype=np.intp), np.array(starts), positions, codes


def measures(codes, routes, starts):
    route_codes = codes[:, routes]
    reward_counts = np.isin(route_codes, REWARD).sum(axis=2)
    left = reward_counts[:, starts == 0].max(axis=1)
    right = reward_counts[:, starts == 1].max(axis=1)
    minimum = np.minimum(left, right)
    gap = np.abs(left - right)
    streak = np.zeros(route_codes.shape[:2], dtype=np.uint8)
    worst = np.zeros(len(codes), dtype=np.uint8)
    signatures = np.zeros(route_codes.shape[:2], dtype=np.int64)
    for step in range(route_codes.shape[2]):
        item = route_codes[:, :, step]
        streak = (streak + 1) * np.isin(item, RISK)
        worst = np.maximum(worst, streak.max(axis=1))
        signatures = signatures * len(TYPES) + item
    sorted_sigs = np.sort(signatures, axis=1)
    unique = 1 + np.count_nonzero(np.diff(sorted_sigs, axis=1), axis=1)
    return minimum, gap, worst, unique, left, right


def random_walk(game_map):
    nodes = {n["id"]: n for layer in game_map for n in layer}
    memo = {}

    def visit(node_id):
        if node_id in memo:
            return memo[node_id]
        node = nodes[node_id]
        is_reward = node["type"] in {"peti", "toko"}
        following = [visit(nxt) for nxt in node["next"]]
        expected = float(is_reward) + (sum(v[0] for v in following) / len(following) if following else 0.0)
        no_reward = 0.0 if is_reward else (sum(v[1] for v in following) / len(following) if following else 1.0)
        memo[node_id] = (expected, no_reward)
        return memo[node_id]

    pairs = [visit(n["id"]) for n in game_map[0]]
    expectations = [v[0] for v in pairs]
    probabilities = [1.0 - v[1] for v in pairs]
    return {
        "expected_left": expectations[0], "expected_right": expectations[1],
        "expected_minimum": min(expectations), "expected_mean": sum(expectations) / 2,
        "encounter_left": probabilities[0], "encounter_right": probabilities[1],
        "encounter_minimum": min(probabilities), "encounter_mean": sum(probabilities) / 2,
    }


def with_types(game_map, nodes, codes):
    assignment = {node["id"]: TYPES[int(code)] for node, code in zip(nodes, codes)}
    return [[{"id": n["id"], "type": assignment[n["id"]], "next": n["next"]}
             for n in layer] for layer in game_map]


def exhaustive(game_map):
    nodes, _, routes, starts, positions, base = graph_data(game_map)
    permutations = [np.array(sorted(set(itertools.permutations(base[pos].tolist()))), dtype=np.uint8)
                    for pos in positions]
    sizes = [len(p) for p in permutations]
    space = math.prod(sizes)
    assert 1 <= space <= 200000
    best_key = None
    best_codes = None
    best_metrics = None
    index_product = itertools.product(*(range(n) for n in sizes))
    evaluated = 0
    while True:
        choice = list(itertools.islice(index_product, BATCH))
        if not choice:
            break
        choice = np.asarray(choice, dtype=np.intp)
        candidates = np.tile(base, (len(choice), 1))
        for layer, pos in enumerate(positions):
            candidates[:, pos] = permutations[layer][choice[:, layer]]
        minimum, gap, risk, unique, left, right = measures(candidates, routes, starts)
        last_best = int(np.lexsort((unique, -risk.astype(np.int64), -gap, minimum))[-1])
        tied = ((minimum == minimum[last_best]) & (gap == gap[last_best]) &
                (risk == risk[last_best]) & (unique == unique[last_best]))
        winner = int(np.flatnonzero(tied)[0])
        key = (int(minimum[winner]), -int(gap[winner]), -int(risk[winner]), int(unique[winner]))
        if best_key is None or key > best_key:
            best_key = key
            best_codes = candidates[winner].copy()
            best_metrics = {
                "minimum_best_reward": key[0], "reward_gap": -key[1],
                "worst_risk_streak": -key[2], "unique_path_share": key[3] / len(routes),
                "best_reward_by_start": [int(left[winner]), int(right[winner])],
                "path_count": len(routes),
            }
        evaluated += len(choice)
    assert evaluated == space
    optimum_map = with_types(game_map, nodes, best_codes)
    return space, sizes, best_metrics, optimum_map


def stats(values):
    a = np.asarray(values, dtype=float)
    return {"mean": float(a.mean()), "median": float(np.median(a)),
            "p05": float(np.quantile(a, .05)), "p95": float(np.quantile(a, .95)),
            "sd": float(a.std(ddof=1)), "min": float(a.min()), "max": float(a.max())}


def bootstrap_diff(first, other, seed):
    diffs = np.asarray(first, dtype=float) - np.asarray(other, dtype=float)
    rng = np.random.default_rng(seed)
    sample_indices = rng.integers(0, len(diffs), (2000, len(diffs)))
    estimates = diffs[sample_indices].mean(axis=1)
    return {"mean_difference": float(diffs.mean()),
            "bootstrap95": [float(x) for x in np.quantile(estimates, [.025, .975])]}


def sign_test(a, b):
    wins = sum(metric_tuple(x) > metric_tuple(y) for x, y in zip(a, b))
    losses = sum(metric_tuple(x) < metric_tuple(y) for x, y in zip(a, b))
    ties = len(a) - wins - losses
    n = wins + losses
    p = min(1.0, 2.0 * sum(math.comb(n, k) for k in range(min(wins, losses) + 1)) / (2 ** n)) if n else 1.0
    return {"wins": wins, "ties": ties, "losses": losses, "p_two_sided": p}


def main():
    batches = read_rows(PHASE2 / "phase2_test" / "maps.jsonl")
    assert len(batches) == 1000
    method_metrics = {m: [] for m in METHODS}
    method_walks = {m: [] for m in (*METHODS, "exact")}
    exact_metrics = []
    records = []
    for serial, (seed, group) in enumerate(batches.items(), 1):
        assert set(group) == set(METHODS)
        base = group["original"]["map"]
        space, layer_sizes, optimum, optimum_map = exhaustive(base)
        exact_metrics.append(optimum)
        method_walks["exact"].append(random_walk(optimum_map))
        record = {"id": f"U{serial:04d}", "seed_input": seed,
                  "search_space": space, "layer_permutations": "/".join(map(str, layer_sizes)),
                  "node_count": sum(map(len, base)), "path_count": optimum["path_count"],
                  "exact_minimum": optimum["minimum_best_reward"],
                  "exact_gap": optimum["reward_gap"], "exact_risk": optimum["worst_risk_streak"],
                  "exact_unique_share": optimum["unique_path_share"],
                  "peti_toko_count": sum(n["type"] in {"peti", "toko"} for layer in base for n in layer)}
        for method in METHODS:
            m = group[method]["metrics"]
            method_metrics[method].append(m)
            method_walks[method].append(random_walk(group[method]["map"]))
            prefix = method + "_"
            record[prefix + "minimum"] = m["minimum_best_reward"]
            record[prefix + "gap"] = m["reward_gap"]
            record[prefix + "risk"] = m["worst_risk_streak"]
            record[prefix + "unique_share"] = m["unique_path_share"]
            record[prefix + "minimum_gap_to_exact"] = optimum["minimum_best_reward"] - m["minimum_best_reward"]
            record[prefix + "gap_gap_to_exact"] = m["reward_gap"] - optimum["reward_gap"]
            record[prefix + "risk_gap_to_exact"] = m["worst_risk_streak"] - optimum["worst_risk_streak"]
            record[prefix + "unique_gap_to_exact"] = optimum["unique_path_share"] - m["unique_path_share"]
            record[prefix + "optimal_first_two"] = int(metric_tuple(m)[:2] == metric_tuple(optimum)[:2])
            record[prefix + "optimal_all_four"] = int(metric_tuple(m) == metric_tuple(optimum))
        records.append(record)
        if serial % 100 == 0:
            print(f"Exhaustive: {serial}/1000 seeds", flush=True)

    with (OUT / "exhaustive_per_seed.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(records[0]))
        writer.writeheader()
        writer.writerows(records)
    space_values = [r["search_space"] for r in records]
    path_values = [r["path_count"] for r in records]
    node_values = [r["node_count"] for r in records]
    summary = {
        "protocol": "PHASE3_PROTOCOL.txt", "seed_count": 1000,
        "search_space": {**stats(space_values), "at_most_744": sum(v <= 744 for v in space_values),
                         "at_most_5000": sum(v <= 5000 for v in space_values),
                         "sum_candidates": sum(space_values)},
        "graph": {"nodes": stats(node_values), "paths": stats(path_values),
                  "layer_0": "2 tempur", "layer_5": "3 api", "layer_6": "1 bos"},
        "exact": {k: stats([m[k] for m in exact_metrics]) for k in
                  ("minimum_best_reward", "reward_gap", "worst_risk_streak", "unique_path_share")},
        "methods": {}, "random_walk": {}, "pairwise_sign_test": {},
        "zero_exact": {"total": sum(r["exact_minimum"] == 0 for r in records),
                       "no_reward_rooms": sum(r["exact_minimum"] == 0 and r["peti_toko_count"] == 0 for r in records),
                       "one_reward_room": sum(r["exact_minimum"] == 0 and r["peti_toko_count"] == 1 for r in records)},
        "local_first_two_miss_ids": [r["id"] for r in records if not r["local_swap_repair_optimal_first_two"]],
    }
    for method in METHODS:
        group = [batches[s][method] for s in batches]
        summary["methods"][method] = {
            "metrics": {k: stats([m[k] for m in method_metrics[method]]) for k in
                        ("minimum_best_reward", "reward_gap", "worst_risk_streak", "unique_path_share")},
            "evaluations": stats([r["evaluations"] for r in group]),
            "generation_ms": stats([r["generation_ms"] for r in group]),
            "optimal_first_two": sum(r[method + "_optimal_first_two"] for r in records),
            "optimal_all_four": sum(r[method + "_optimal_all_four"] for r in records),
            "optimal_minimum": sum(r[method + "_minimum"] == r["exact_minimum"] for r in records),
        }
    walk_keys = list(method_walks["exact"][0])
    for method in method_walks:
        summary["random_walk"][method] = {k: stats([r[k] for r in method_walks[method]]) for k in walk_keys}
    pairs = [("local_minus_original", "local_swap_repair", "original"),
             ("ga_minus_original", "genetic_algorithm", "original"),
             ("random_minus_original", "random_search", "original"),
             ("ga_minus_local", "genetic_algorithm", "local_swap_repair"),
             ("exact_minus_local", "exact", "local_swap_repair")]
    for pi, (label, a, b) in enumerate(pairs):
        summary["random_walk"][label] = {
            k: bootstrap_diff([r[k] for r in method_walks[a]], [r[k] for r in method_walks[b]],
                              BOOTSTRAP_SEED + pi * 100 + ki)
            for ki, k in enumerate(walk_keys)}
    for label, a, b in (("ga_vs_local", "genetic_algorithm", "local_swap_repair"),
                        ("ga_vs_random", "genetic_algorithm", "random_search"),
                        ("local_vs_random", "local_swap_repair", "random_search")):
        summary["pairwise_sign_test"][label] = sign_test(method_metrics[a], method_metrics[b])
    dev_runs = {
        "one_start": PHASE2 / "phase2_dev_one_start" / "maps.jsonl",
        "four_starts": PHASE2 / "phase2_dev" / "maps.jsonl",
    }
    summary["development_tuning"] = {}
    for label, path in dev_runs.items():
        dev = read_rows(path)
        group = [v["local_swap_repair"] for v in dev.values()]
        summary["development_tuning"][label] = {
            "seeds": len(dev),
            "minimum_reward": stats([r["metrics"]["minimum_best_reward"] for r in group]),
            "reward_gap": stats([r["metrics"]["reward_gap"] for r in group]),
            "evaluations": stats([r["evaluations"] for r in group]),
            "generation_ms": stats([r["generation_ms"] for r in group]),
        }
    sensitivity = json.loads((PHASE2 / "phase2_test" / "sensitivity.json").read_text(encoding="utf-8"))
    summary["sensitivity"] = {name: scheme["means"] for name, scheme in sensitivity["schemes"].items()}
    (OUT / "exhaustive_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"search_space": summary["search_space"], "exact": summary["exact"],
                      "local_misses": summary["local_first_two_miss_ids"]}, indent=2), flush=True)


if __name__ == "__main__":
    main()
