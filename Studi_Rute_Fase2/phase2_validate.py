"""Independent Python audit of the Node.js route experiment output."""
import collections
import hashlib
import json
import math
import statistics
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else "result")
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
summary = json.loads((root / "summary.json").read_text(encoding="utf-8"))
assert hashlib.sha256((root / "logika_snapshot.js").read_bytes()).hexdigest() == manifest["source_sha256"]

rows = [json.loads(line) for line in (root / "maps.jsonl").read_text(encoding="utf-8").splitlines()]
by_seed = collections.defaultdict(dict)
for row in rows:
    assert row["source_sha256"] == manifest["source_sha256"]
    assert row["method"] not in by_seed[row["seed"]]
    by_seed[row["seed"]][row["method"]] = row

assert len(by_seed) == manifest["seed_count"]
assert len(rows) == 4 * manifest["seed_count"]
assert all(set(batch) == {"original", "random_search", "genetic_algorithm", "local_swap_repair"} for batch in by_seed.values())

reward = set(manifest["reward_types"])
risk = set(manifest["high_risk_types"])

def compute_metrics(game_map):
    nodes = {node["id"]: node for layer in game_map for node in layer}
    all_routes = []

    def walk(node_id, start, route):
        node = nodes[node_id]
        route = route + [node["type"]]
        if not node["next"]:
            all_routes.append((start, route))
        else:
            for nxt in node["next"]:
                assert nxt in nodes
                walk(nxt, start, route)

    for start, node in enumerate(game_map[0]):
        walk(node["id"], start, [])
    assert all(len(route) == len(game_map) and route[-1] == "bos" for _, route in all_routes)
    best = [-1] * len(game_map[0])
    longest_streak = 0
    paths_with_reward = 0
    signatures = set()
    for start, route in all_routes:
        count_reward = sum(t in reward for t in route)
        best[start] = max(best[start], count_reward)
        paths_with_reward += count_reward > 0
        streak = 0
        for room in route:
            streak = streak + 1 if room in risk else 0
            longest_streak = max(longest_streak, streak)
        signatures.add(tuple(route))
    return {
        "minimum_best_reward": min(best),
        "reward_gap": max(best) - min(best),
        "worst_risk_streak": longest_streak,
        "unique_path_share": len(signatures) / len(all_routes),
        "paths_with_reward_share": paths_with_reward / len(all_routes),
        "path_count": len(all_routes),
        "best_reward_by_start": best,
    }

checked = 0
for seed, batch in by_seed.items():
    graph = [[(n["id"], n["next"]) for n in layer] for layer in batch["original"]["map"]]
    layer_histograms = [collections.Counter(n["type"] for n in layer) for layer in batch["original"]["map"]]
    for method, row in batch.items():
        assert row["generation_ms"] >= 0
        if method == "original":
            assert row["evaluations"] == 1
        elif method == "local_swap_repair":
            assert row["evaluations"] >= manifest["local_swap_restarts"]
        else:
            assert row["evaluations"] == manifest["candidates_per_optimization"]
        assert [[(n["id"], n["next"]) for n in layer] for layer in row["map"]] == graph
        assert [collections.Counter(n["type"] for n in layer) for layer in row["map"]] == layer_histograms
        actual = compute_metrics(row["map"])
        for metric, value in actual.items():
            recorded = row["metrics"][metric]
            if isinstance(value, float):
                assert math.isclose(value, recorded, rel_tol=0, abs_tol=1e-12), (seed, method, metric)
            else:
                assert value == recorded, (seed, method, metric)
        checked += 1

for method in ("original", "random_search", "genetic_algorithm", "local_swap_repair"):
    group = [batch[method] for batch in by_seed.values()]
    for metric, stats in summary["method"][method].items():
        values = [r["generation_ms"] if metric == "generation_ms" else r["metrics"][metric] for r in group]
        assert math.isclose(statistics.mean(values), stats["mean"], rel_tol=0, abs_tol=1e-10)

result = {
    "status": "passed",
    "seeds_checked": len(by_seed),
    "maps_checked": checked,
    "metrics_recomputed_independently": True,
    "topology_and_layer_room_counts_unchanged": True,
    "source_hash_verified": True,
    "summary_means_recomputed": True,
}
(root / "validation.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result, indent=2))
