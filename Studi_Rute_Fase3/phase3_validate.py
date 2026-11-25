"""Independent checks of Phase 3 outputs; does not import phase3_analyze.py."""
from __future__ import annotations

import csv
import itertools
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
P2 = ROOT.parent / "Dungeon_Strip_Studi_Rute_Fase2"
if not P2.exists():
    P2 = ROOT.parent / "Studi_Rute_Fase2"
SAMPLE = {"U0001", "U0013", "U0067", "U0500", "U1000"}


def routes(game_map):
    lookup = {n["id"]: n for layer in game_map for n in layer}
    all_routes = []

    def walk(node_id, path, prob, start):
        node = lookup[node_id]
        path = path + (node_id,)
        if not node["next"]:
            all_routes.append((start, path, prob))
        else:
            for target in node["next"]:
                walk(target, path, prob / len(node["next"]), start)

    for start, node in enumerate(game_map[0]):
        walk(node["id"], (), 1.0, start)
    return all_routes


def score(assignment, all_routes):
    reward_best = [0, 0]
    worst = 0
    signatures = set()
    for start, path, _ in all_routes:
        types = tuple(assignment[n] for n in path)
        reward_best[start] = max(reward_best[start], sum(t in ("peti", "toko") for t in types))
        streak = 0
        for item in types:
            streak = streak + 1 if item in ("elit", "tantangan") else 0
            worst = max(worst, streak)
        signatures.add(types)
    return (min(reward_best), -abs(reward_best[0] - reward_best[1]), -worst, len(signatures))


def walk_metrics(game_map, all_routes):
    assignment = {n["id"]: n["type"] for layer in game_map for n in layer}
    values = {}
    for start, side in ((0, "left"), (1, "right")):
        subset = [(p, w) for s, p, w in all_routes if s == start]
        assert math.isclose(sum(w for _, w in subset), 1, abs_tol=1e-12)
        expected = sum(w * sum(assignment[n] in ("peti", "toko") for n in p) for p, w in subset)
        encounter = sum(w for p, w in subset if any(assignment[n] in ("peti", "toko") for n in p))
        values["expected_" + side] = expected
        values["encounter_" + side] = encounter
    values["expected_minimum"] = min(values["expected_left"], values["expected_right"])
    values["expected_mean"] = (values["expected_left"] + values["expected_right"]) / 2
    values["encounter_minimum"] = min(values["encounter_left"], values["encounter_right"])
    values["encounter_mean"] = (values["encounter_left"] + values["encounter_right"]) / 2
    return values


SCHEMES = {
    "main_peti_toko__elit_tantangan": ({"peti", "toko"}, {"elit", "tantangan"}),
    "peti_only__elit_tantangan": ({"peti"}, {"elit", "tantangan"}),
    "peti_toko_misteri__elit_tantangan": ({"peti", "toko", "misteri"}, {"elit", "tantangan"}),
    "peti_toko__all_combat": ({"peti", "toko"}, {"elit", "tantangan", "tempur"}),
}


def sensitivity_metrics(game_map, all_routes, reward_types, risk_types):
    assignment = {n["id"]: n["type"] for layer in game_map for n in layer}
    best = [0, 0]
    worst = 0
    with_reward = 0
    for start, path, _ in all_routes:
        types = [assignment[n] for n in path]
        rewards = sum(t in reward_types for t in types)
        best[start] = max(best[start], rewards)
        with_reward += rewards > 0
        streak = 0
        for t in types:
            streak = streak + 1 if t in risk_types else 0
            worst = max(worst, streak)
    return {"minimum_best_reward": min(best), "reward_gap": abs(best[0]-best[1]),
            "worst_risk_streak": worst, "paths_with_reward_share": with_reward/len(all_routes)}


def main():
    summary = json.loads((ROOT / "exhaustive_summary.json").read_text(encoding="utf-8"))
    csv_rows = list(csv.DictReader((ROOT / "exhaustive_per_seed.csv").open(encoding="utf-8", newline="")))
    assert len(csv_rows) == summary["seed_count"] == 1000
    assert sum(int(r["search_space"]) for r in csv_rows) == summary["search_space"]["sum_candidates"]
    assert sum(int(r["search_space"]) <= 744 for r in csv_rows) == summary["search_space"]["at_most_744"]
    assert sum(int(r["search_space"]) <= 5000 for r in csv_rows) == summary["search_space"]["at_most_5000"]
    assert [r["id"] for r in csv_rows if r["local_swap_repair_optimal_first_two"] == "0"] == summary["local_first_two_miss_ids"]
    assert Counter(int(r["exact_minimum"]) for r in csv_rows)[0] == summary["zero_exact"]["total"]
    by_id = {r["id"]: r for r in csv_rows}
    target = {by_id[id]["seed_input"]: id for id in SAMPLE}
    raw = {}
    for line in (P2 / "phase2_test" / "maps.jsonl").open(encoding="utf-8"):
        item = json.loads(line)
        if item["seed"] in target:
            raw[(item["seed"], item["method"])] = item
    assert len(raw) == 4 * len(SAMPLE)
    checked = 0
    for seed, id in target.items():
        game_map = raw[(seed, "original")]["map"]
        record = by_id[id]
        all_routes = routes(game_map)
        mutable = [game_map[i] for i in range(1, 5)]
        perms = [sorted(set(itertools.permutations(n["type"] for n in layer))) for layer in mutable]
        assert math.prod(map(len, perms)) == int(record["search_space"])
        assignment = {n["id"]: n["type"] for layer in game_map for n in layer}
        best = None
        for combination in itertools.product(*perms):
            for layer, values in zip(mutable, combination):
                for node, value in zip(layer, values):
                    assignment[node["id"]] = value
            result = score(assignment, all_routes)
            if best is None or result > best:
                best = result
        assert best[0] == int(record["exact_minimum"])
        assert -best[1] == int(record["exact_gap"])
        assert -best[2] == int(record["exact_risk"])
        assert math.isclose(best[3] / len(all_routes), float(record["exact_unique_share"]), abs_tol=1e-12)
        for method in ("original", "random_search", "genetic_algorithm", "local_swap_repair"):
            item = raw[(seed, method)]
            got = score({n["id"]: n["type"] for layer in item["map"] for n in layer}, all_routes)
            assert got[:3] == (item["metrics"]["minimum_best_reward"], -item["metrics"]["reward_gap"], -item["metrics"]["worst_risk_streak"])
            checked += 1
    walk_sums = {method: Counter() for method in ("original", "random_search", "genetic_algorithm", "local_swap_repair")}
    walk_count = Counter()
    sensitivity_sums = Counter()
    for line in (P2 / "phase2_test" / "maps.jsonl").open(encoding="utf-8"):
        item = json.loads(line)
        method = item["method"]
        all_routes = routes(item["map"])
        measures = walk_metrics(item["map"], all_routes)
        walk_sums[method].update(measures)
        walk_count[method] += 1
        for name, (rewards, risks) in SCHEMES.items():
            for metric, value in sensitivity_metrics(item["map"], all_routes, rewards, risks).items():
                sensitivity_sums[(name, method, metric)] += value
    for method in walk_sums:
        assert walk_count[method] == 1000
        for metric, total in walk_sums[method].items():
            assert math.isclose(total / 1000, summary["random_walk"][method][metric]["mean"], abs_tol=1e-12)
    for (scheme, method, metric), total in sensitivity_sums.items():
        assert math.isclose(total / 1000, summary["sensitivity"][scheme][method][metric], abs_tol=1e-12), (scheme, method, metric)
    p2_summary = json.loads((P2 / "phase2_test" / "summary.json").read_text(encoding="utf-8"))
    assert p2_summary["method"]["original"]["minimum_best_reward"]["mean"] == 0.981
    assert p2_summary["method"]["genetic_algorithm"]["minimum_best_reward"]["mean"] == 1.651
    assert p2_summary["method"]["local_swap_repair"]["minimum_best_reward"]["mean"] == 1.639
    for method in ("original", "random_search", "genetic_algorithm", "local_swap_repair"):
        for metric in ("minimum_best_reward", "reward_gap", "worst_risk_streak", "unique_path_share"):
            assert math.isclose(summary["methods"][method]["metrics"][metric]["mean"],
                                p2_summary["method"][method][metric]["mean"], abs_tol=1e-12)
    output = {"status": "passed", "records": len(csv_rows), "sampled_seeds_reenumerated": sorted(SAMPLE),
              "sampled_method_maps_checked": checked, "walk_maps_checked": sum(walk_count.values()),
              "sensitivity_values_checked": len(sensitivity_sums),
              "phase2_means_match": True}
    (ROOT / "validation.json").write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
