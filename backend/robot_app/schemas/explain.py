"""
Schemas for XAI explanations: SHAP and Grad-CAM.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FeatureContribution(BaseModel):
    feature: str
    contribution: float
    value: float
    direction: str = "POSITIVE"  # POSITIVE or NEGATIVE


class ShapExplanationResponse(BaseModel):
    prediction_id: Optional[str] = None
    predicted_class: str
    base_value: float
    features: List[FeatureContribution]
    summary_text: str
    chart_data: List[Dict[str, Any]]


class GradCamExplanationResponse(BaseModel):
    prediction_id: Optional[str] = None
    predicted_class: str
    confidence: float
    original_image_base64: str
    heatmap_base64: str
    overlay_base64: str
    attention_region_description: str
