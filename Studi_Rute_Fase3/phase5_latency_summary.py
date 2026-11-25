"""Tail latency from the preserved Node.js repeated-timing records."""
from __future__ import annotations

import csv
import json
from collections import defaultdict

import numpy as np

from phase3_analyze import HERE


def main():
    by_method = defaultdict(list)
    with (HERE / "phase4_timing_methods" / "maps.jsonl").open(encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            by_method[row["method"]].append(row["generation_ms"])
    with (HERE / "phase4_node_enumeration_per_seed.csv").open(encoding="utf-8", newline="") as f:
        by_method["exact"] = [float(r["elapsed_ms"]) for r in csv.DictReader(f)]
    assert set(by_method) == {"original", "random_search", "genetic_algorithm",
                              "local_swap_repair", "exact"}
    budget = 1000 / 60
    result = {"frame_budget_ms": budget, "frame_budget_is_illustrative": True,
              "measurement_scope": "Node.js computation only; game integration not measured",
              "methods": {}}
    for method, raw in by_method.items():
        values = np.asarray(raw, dtype=float)
        assert values.size == 1000
        result["methods"][method] = {
            "count": 1000, "mean_ms": float(values.mean()),
            "median_ms": float(np.median(values)),
            "p95_ms": float(np.quantile(values, .95)),
            "p99_ms": float(np.quantile(values, .99)),
            "max_ms": float(values.max()),
            "over_frame_budget": int(np.count_nonzero(values > budget)),
        }
    (HERE / "phase5_latency_summary.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
