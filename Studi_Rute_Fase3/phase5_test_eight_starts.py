"""Post-hoc eight-start sensitivity on the frozen 1,000 test inputs.

Only the local-search restart count in a temporary copy of phase2.mjs changes.
The primary four-start maps and their timing remain untouched.
"""
from __future__ import annotations

import csv
import json
import os
import statistics as st
import subprocess
import tempfile
from pathlib import Path

from phase3_analyze import HERE, PHASE2, metric_tuple, read_rows

NODE = os.environ.get("NODE_EXECUTABLE", "node")


def main():
    original = (PHASE2 / "phase2.mjs").read_text(encoding="utf-8")
    assert original.count("restart < 4") == 1
    assert original.count("local_swap_restarts:4") == 1
    derived = original.replace("restart < 4", "restart < 8")
    derived = derived.replace("local_swap_restarts:4", "local_swap_restarts:8")
    primary = read_rows(PHASE2 / "phase2_test" / "maps.jsonl")
    exact = {r["seed_input"]: r for r in csv.DictReader(
        (HERE / "exhaustive_per_seed.csv").open(encoding="utf-8", newline=""))}

    with tempfile.TemporaryDirectory(prefix="phase5_eight_starts_") as tmp:
        path = Path(tmp)
        script = path / "phase2_eight_starts.mjs"
        script.write_text(derived, encoding="utf-8")
        out = path / "result"
        subprocess.run([NODE, str(script), "--source",
                        str(PHASE2 / "phase2_test" / "logika_snapshot.js"),
                        "--count", "1000", "--start", "2024-01-01", "--out", str(out)],
                       check=True, stdout=subprocess.DEVNULL)
        batches = read_rows(out / "maps.jsonl")

    assert set(batches) == set(primary) == set(exact)
    rows = []
    for seed in sorted(batches):
        reference = primary[seed]
        current = batches[seed]
        for method in ("original", "random_search", "genetic_algorithm"):
            for field in ("metrics", "map", "evaluations", "source_sha256"):
                assert current[method][field] == reference[method][field], (seed, method, field)
        new = current["local_swap_repair"]
        old = reference["local_swap_repair"]
        assert new["source_sha256"] == old["source_sha256"]
        assert new["evaluations"] >= old["evaluations"]
        assert metric_tuple(new["metrics"]) >= metric_tuple(old["metrics"])
        target = exact[seed]
        optimum = (int(target["exact_minimum"]), -int(target["exact_gap"]),
                   -int(target["exact_risk"]),
                   float(target["exact_unique_share"]))
        assert metric_tuple(new["metrics"]) <= optimum
        rows.append({
            "seed_input": seed,
            "evaluations_four": old["evaluations"],
            "evaluations_eight": new["evaluations"],
            "minimum_four": old["metrics"]["minimum_best_reward"],
            "minimum_eight": new["metrics"]["minimum_best_reward"],
            "optimal_first_two_four": int(metric_tuple(old["metrics"])[:2] == optimum[:2]),
            "optimal_first_two_eight": int(metric_tuple(new["metrics"])[:2] == optimum[:2]),
            "optimal_all_four_four": int(metric_tuple(old["metrics"]) == optimum),
            "optimal_all_four_eight": int(metric_tuple(new["metrics"]) == optimum),
        })

    output = HERE / "phase5_eight_starts_test_per_seed.csv"
    with output.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    summary = {
        "status": "post_hoc_sensitivity_not_primary_test_method",
        "seed_count": len(rows),
        "mean_evaluations_four": st.mean(r["evaluations_four"] for r in rows),
        "mean_evaluations_eight": st.mean(r["evaluations_eight"] for r in rows),
        "mean_minimum_four": st.mean(r["minimum_four"] for r in rows),
        "mean_minimum_eight": st.mean(r["minimum_eight"] for r in rows),
        "optimal_first_two_four": sum(r["optimal_first_two_four"] for r in rows),
        "optimal_first_two_eight": sum(r["optimal_first_two_eight"] for r in rows),
        "optimal_all_four_four": sum(r["optimal_all_four_four"] for r in rows),
        "optimal_all_four_eight": sum(r["optimal_all_four_eight"] for r in rows),
        "remaining_first_two_failures": [r["seed_input"] for r in rows
                                          if not r["optimal_first_two_eight"]],
    }
    (HERE / "phase5_eight_starts_test_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
