"""
Explainability API Endpoints for SHAP and Grad-CAM.
"""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException
import numpy as np
import torch

from robot_app.core.config import get_failure_classes
from robot_app.ml.demo_generator import (
    base64_to_image,
    generate_synthetic_inspection_image,
    generate_synthetic_sensor_window,
    image_to_base64,
)
from robot_app.ml.predictor import predictor
from robot_app.schemas.explain import (
    GradCamExplanationResponse,
    ShapExplanationResponse,
)

router = APIRouter(prefix="/explain", tags=["Explainability"])


@router.post("/shap", response_model=ShapExplanationResponse)
def explain_sensor_shap(failure_class: str = "Bearing Failure"):
    """
    Computes SHAP feature attributions on the sensor branch
    demonstrating positive and negative contributions.
    """
    classes = get_failure_classes()
    target_idx = classes.index(failure_class) if failure_class in classes else 1

    # Generate synthetic sensor data for explanation
    sensor_mat, feats = generate_synthetic_sensor_window(failure_class=failure_class)
    sensor_tensor = torch.from_numpy(sensor_mat.astype(np.float32)).unsqueeze(0).permute(0, 2, 1)

    res = predictor.shap_explainer.explain(
        sensor_window=sensor_tensor,
        sensor_features_dict=feats,
        target_class_idx=target_idx,
    )
    return res


@router.post("/gradcam", response_model=GradCamExplanationResponse)
def explain_vision_gradcam(
    failure_class: str = "Bearing Failure",
    image_base64: Optional[str] = None,
):
    """
    Computes Grad-CAM activations on ResNet18 layer4
    and overlays the heatmap on the inspection image.
    """
    classes = get_failure_classes()
    target_idx = classes.index(failure_class) if failure_class in classes else 1

    if image_base64:
        try:
            img = base64_to_image(image_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")
    else:
        img = generate_synthetic_inspection_image(failure_class=failure_class)

    tensor = predictor.vision_preprocessor.preprocess_pil(img)
    cam_res = predictor.gradcam_explainer.generate_cam(
        input_tensor=tensor,
        original_pil=img,
        target_class_idx=target_idx,
        predicted_class_name=failure_class,
        confidence=0.914,
    )
    return cam_res
