"""
Master Experiment Runner: Full System Evaluation.
Executes:
1. run_baselines.py
2. run_fusion.py
3. run_robustness.py
4. run_xai.py
Generates aggregated summary report in results/metrics/full_evaluation_summary.json.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from experiments.run_baselines import run_baselines_evaluation
from experiments.run_fusion import run_fusion_comparison
from experiments.run_robustness import run_robustness_experiments
from experiments.run_xai import run_xai_experiments


def main():
    print("#" * 70)
    print("STARTING FULL BENCHMARK & RESEARCH EVALUATION SUITE")
    print("#" * 70)

    b_res = run_baselines_evaluation(num_samples=40)
    f_res = run_fusion_comparison(num_samples=40)
    r_res = run_robustness_experiments()
    x_res = run_xai_experiments()

    summary = {
        "title": "Explainable and Robust AI for Industrial Robot Failure Prediction",
        "baselines": b_res,
        "fusion_comparison": f_res,
        "robustness": r_res,
        "xai": x_res,
    }

    out_file = PROJECT_ROOT / "results" / "metrics" / "full_evaluation_summary.json"
    with open(out_file, "w") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "#" * 70)
    print(f"FULL EVALUATION COMPLETED! Summary saved to:\n{out_file}")
    print("#" * 70)


if __name__ == "__main__":
    main()
