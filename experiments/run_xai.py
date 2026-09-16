"""
Experiment Runner: Explainability Evaluation (Exp E vs Exp F).
Generates sample SHAP waterfall/bar values and Grad-CAM overlays for failure classes.
Saves audit outputs to results/explanations/.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

import torch
from robot_app.ml.demo_generator import generate_synthetic_inspection_image, generate_synthetic_sensor_window
from robot_app.ml.predictor import predictor

XAI_DIR = PROJECT_ROOT / "results" / "explanations"
XAI_DIR.mkdir(parents=True, exist_ok=True)


def run_xai_experiments():
    print("=" * 60)
    print("RUNNING XAI EVALUATION (SHAP + GRAD-CAM)")
    print("=" * 60)

    test_classes = ["Bearing Failure", "Overheating", "Mechanical Wear"]
    explanations = {}

    for cls_name in test_classes:
        print(f"\n[Generating XAI for {cls_name}]...")
        s_mat, s_feat = generate_synthetic_sensor_window(cls_name)
        img = generate_synthetic_inspection_image(cls_name)

        s_tensor = torch.from_numpy(s_mat.astype(float)).float().unsqueeze(0).permute(0, 2, 1)
        
        # 1. SHAP Feature Attribution
        target_idx = predictor.classes.index(cls_name)
        shap_res = predictor.shap_explainer.explain(s_tensor, s_feat, target_idx)
        print(f"  -> SHAP top driver: {shap_res['features'][0]['feature']} ({shap_res['features'][0]['contribution']:+.2f})")

        # 2. Grad-CAM Activation Map
        v_tensor = predictor.vision_preprocessor.preprocess_pil(img)
        cam_res = predictor.gradcam_explainer.generate_cam(
            input_tensor=v_tensor,
            original_pil=img,
            target_class_idx=target_idx,
            predicted_class_name=cls_name,
            confidence=0.914,
        )
        print(f"  -> Grad-CAM Localization: {cam_res['attention_region_description']}")

        explanations[cls_name] = {
            "shap_summary": shap_res["summary_text"],
            "top_shap_factors": shap_res["features"][:3],
            "gradcam_region": cam_res["attention_region_description"],
        }

    out_file = XAI_DIR / "xai_audit.json"
    with open(out_file, "w") as f:
        json.dump(explanations, f, indent=2)

    print(f"\n[SUCCESS] XAI audit saved to: {out_file}")
    return explanations


if __name__ == "__main__":
    run_xai_experiments()
