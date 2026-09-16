"""
Experiment Runner: Robustness Evaluation (Experiments G, H, I, J).
Tests:
- Gaussian noise (0% to 40%)
- Sensor dropout (0% to 50%)
- Missing modality (Full vs Sensor-only vs Vision-only)
Saves results to results/robustness/robustness_results.json.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from robot_app.core.config import get_failure_classes
from robot_app.ml.demo_generator import generate_synthetic_inspection_image, generate_synthetic_sensor_window
from robot_app.ml.predictor import predictor

ROB_DIR = PROJECT_ROOT / "results" / "robustness"
ROB_DIR.mkdir(parents=True, exist_ok=True)


def run_robustness_experiments():
    print("=" * 60)
    print("RUNNING ROBUSTNESS EXPERIMENTS (Exp G, Exp H, Exp I, Exp J)")
    print("=" * 60)

    classes = get_failure_classes()
    num_classes = len(classes)
    n_samples = 30

    # Noise Stress Test
    noise_results = []
    for noise in [0.0, 0.1, 0.2, 0.3, 0.4]:
        correct = 0
        for i in range(n_samples):
            cls = classes[i % num_classes]
            s_mat, _ = generate_synthetic_sensor_window(cls, noise_level=noise)
            img = generate_synthetic_inspection_image(cls)
            res = predictor.predict_multimodal(sensor_data=s_mat, image_pil=img, noise_level=noise, is_demo=False)
            if res["failure_class"] == cls:
                correct += 1
        acc = correct / n_samples
        noise_results.append({"noise_level": noise, "accuracy": round(acc, 4)})
        print(f"Noise {noise*100:.0f}% -> Accuracy: {acc:.2%}")

    # Dropout Stress Test
    drop_results = []
    for drop in [0.0, 0.1, 0.2, 0.3, 0.4, 0.5]:
        correct = 0
        for i in range(n_samples):
            cls = classes[i % num_classes]
            s_mat, _ = generate_synthetic_sensor_window(cls, dropout_rate=drop)
            img = generate_synthetic_inspection_image(cls)
            res = predictor.predict_multimodal(sensor_data=s_mat, image_pil=img, dropout_rate=drop, is_demo=False)
            if res["failure_class"] == cls:
                correct += 1
        acc = correct / n_samples
        drop_results.append({"dropout_level": drop, "accuracy": round(acc, 4)})
        print(f"Dropout {drop*100:.0f}% -> Accuracy: {acc:.2%}")

    # Missing Modality Test
    print("\nTesting Missing Modality Graceful Degradation...")
    modalities = [
        ("Full Multimodal", True, True),
        ("Sensor Only (Missing Vision)", True, False),
        ("Vision Only (Missing Sensor)", False, True),
    ]
    mod_results = {}
    for name, has_sensor, has_vision in modalities:
        correct = 0
        for i in range(n_samples):
            cls = classes[i % num_classes]
            s_mat = generate_synthetic_sensor_window(cls)[0] if has_sensor else None
            img = generate_synthetic_inspection_image(cls) if has_vision else None
            res = predictor.predict_multimodal(sensor_data=s_mat, image_pil=img, is_demo=False)
            if res["failure_class"] == cls:
                correct += 1
        acc = correct / n_samples
        mod_results[name] = {"accuracy": round(acc, 4)}
        print(f"  {name} -> Accuracy: {acc:.2%}")

    payload = {
        "noise_curve": noise_results,
        "dropout_curve": drop_results,
        "missing_modality": mod_results,
    }

    out_file = ROB_DIR / "robustness_results.json"
    with open(out_file, "w") as f:
        json.dump(payload, f, indent=2)

    print(f"\n[SUCCESS] Robustness experiments saved to: {out_file}")
    return payload


if __name__ == "__main__":
    run_robustness_experiments()
