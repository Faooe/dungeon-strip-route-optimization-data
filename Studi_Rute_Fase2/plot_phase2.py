"""Publication-oriented summary figure from the phase-2 raw maps."""
import collections
import json
import random
import statistics
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

root = Path(sys.argv[1] if len(sys.argv) > 1 else "result")
rows = [json.loads(line) for line in (root / "maps.jsonl").read_text(encoding="utf-8").splitlines()]
groups = collections.defaultdict(list)
for row in rows:
    groups[row["method"]].append(row)

methods = ["original", "random_search", "genetic_algorithm", "local_swap_repair"]
labels = ["Original", "Random search", "Genetic algorithm", "Local repair"]
colors = ["#616b75", "#4b88a2", "#bc6c3c", "#4b8a65"]
metrics = [
    ("minimum_best_reward", "Minimum best reward opportunities", "Higher is better"),
    ("reward_gap", "Reward opportunity gap", "Lower is better"),
    ("worst_risk_streak", "Longest high-risk streak", "Lower is better"),
    ("unique_path_share", "Unique route-type share", "Higher is better"),
]

def interval(values, seed):
    rng = random.Random(seed)
    n = len(values)
    means = [sum(values[rng.randrange(n)] for _ in range(n)) / n for _ in range(1000)]
    means.sort()
    return statistics.mean(values), means[24], means[974]

plt.rcParams.update({"font.size": 9, "axes.spines.top": False, "axes.spines.right": False,
                     "figure.dpi": 180, "savefig.dpi": 300})
fig, axes = plt.subplots(2, 2, figsize=(10, 6.6), constrained_layout=True)
for k, (metric, title, direction) in enumerate(metrics):
    ax = axes.flat[k]
    for i, method in enumerate(methods):
        values = [row["metrics"][metric] for row in groups[method]]
        mean, low, high = interval(values, 2100 + 10*k+i)
        ax.errorbar(mean, i, xerr=[[mean-low],[high-mean]], fmt="o", color=colors[i],
                    capsize=3, markersize=6, linewidth=1.6)
    ax.set_yticks(range(len(methods)), labels)
    ax.invert_yaxis()
    ax.set_title(f"{chr(65+k)}. {title}", loc="left", weight="bold", pad=10)
    ax.set_xlabel(f"Mean over 1,000 seeds · {direction}")
    ax.grid(axis="x", alpha=.22)
fig.suptitle("Dungeon Strip route-generation study: structural outcomes", weight="bold", fontsize=13)
fig.savefig(root / "structural_outcomes.png")
plt.close(fig)

fig, ax = plt.subplots(figsize=(7.4, 3.8), constrained_layout=True)
for i, method in enumerate(methods):
    values = [row["generation_ms"] for row in groups[method]]
    mean, low, high = interval(values, 3100+i)
    ax.errorbar(mean, i, xerr=[[mean-low],[high-mean]], fmt="o", color=colors[i],
                capsize=3, markersize=7, linewidth=1.7)
ax.set_yticks(range(len(methods)), labels)
ax.invert_yaxis()
ax.set_xlabel("Mean generation time per map (ms; logarithmic axis)")
ax.set_xscale("log")
ax.grid(axis="x", alpha=.25, which="both")
ax.set_title("Runtime comparison (indicative single-process measurement)", loc="left", weight="bold")
fig.savefig(root / "generation_time.png")
plt.close(fig)
print(root / "structural_outcomes.png")
print(root / "generation_time.png")
