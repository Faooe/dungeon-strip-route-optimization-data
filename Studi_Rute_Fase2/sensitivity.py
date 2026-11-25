"""Exploratory sensitivity analysis using the untouched phase-2 test maps."""
import collections
import json
import statistics
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else "result")
rows = [json.loads(line) for line in (root / "maps.jsonl").read_text(encoding="utf-8").splitlines()]
schemes = {
    "main_peti_toko__elit_tantangan": ({"peti", "toko"}, {"elit", "tantangan"}),
    "peti_only__elit_tantangan": ({"peti"}, {"elit", "tantangan"}),
    "peti_toko_misteri__elit_tantangan": ({"peti", "toko", "misteri"}, {"elit", "tantangan"}),
    "peti_toko__all_combat": ({"peti", "toko"}, {"tempur", "elit", "tantangan"}),
}

def routes(game_map):
    nodes = {n["id"]: n for layer in game_map for n in layer}
    out = []
    def walk(node_id, start, sequence):
        node = nodes[node_id]
        sequence = sequence + [node["type"]]
        if node["next"]:
            for nxt in node["next"]:
                walk(nxt, start, sequence)
        else:
            out.append((start, sequence))
    for i, n in enumerate(game_map[0]):
        walk(n["id"], i, [])
    return out

def metrics(game_map, reward, risk):
    route_list = routes(game_map)
    best = [-1] * len(game_map[0])
    worst_streak = 0
    with_reward = 0
    for start, sequence in route_list:
        n_reward = sum(t in reward for t in sequence)
        best[start] = max(best[start], n_reward)
        with_reward += n_reward > 0
        streak = 0
        for room in sequence:
            streak = streak + 1 if room in risk else 0
            worst_streak = max(worst_streak, streak)
    return {
        "minimum_best_reward": min(best),
        "reward_gap": max(best) - min(best),
        "worst_risk_streak": worst_streak,
        "paths_with_reward_share": with_reward / len(route_list),
    }

output = {"note":"Exploratory sensitivity on the same test maps; algorithms were optimized only under the main definition.", "schemes":{}}
for name, (reward, risk) in schemes.items():
    group = collections.defaultdict(list)
    for row in rows:
        group[row["method"]].append(metrics(row["map"], reward, risk))
    output["schemes"][name] = {
        "reward_types":sorted(reward), "risk_types":sorted(risk),
        "means": {
            method:{key:statistics.mean(m[key] for m in values) for key in values[0]}
            for method, values in group.items()
        }
    }
(root / "sensitivity.json").write_text(json.dumps(output, indent=2), encoding="utf-8")
print(json.dumps(output, indent=2))
