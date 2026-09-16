"""
Model Registry and Comparison API Endpoints.
Compares:
- Baseline 1: Sensor-only CNN/LSTM
- Baseline 2: Vision-only ResNet18
- Baseline 3: Non-explainable Multimodal Fusion
- Proposed A: Concatenation Multimodal Fusion + XAI
- Proposed B: Cross-Attention Multimodal Fusion + XAI
"""
from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter

router = APIRouter(prefix="/models", tags=["Models"])

_MODELS_REGISTRY = [
    {
        "id": "model_cross_attn_v1",
        "name": "Cross-Attention Multimodal Fusion (Proposed)",
        "architecture": "1D CNN-LSTM + ResNet18 + Cross-Attention",
        "modality": "multimodal",
        "fusion_method": "cross_attention",
        "accuracy": 0.948,
        "precision": 0.942,
        "recall": 0.946,
        "f1_score": 0.944,
        "auc_roc": 0.985,
        "latency_ms": 14.2,
        "parameters": "14.2M",
        "is_active": True,
        "xai_supported": True,
        "status": "Trained & Active",
    },
    {
        "id": "model_concat_v1",
        "name": "Concatenation Multimodal Fusion",
        "architecture": "1D CNN-LSTM + ResNet18 + Dense Fusion",
        "modality": "multimodal",
        "fusion_method": "concat",
        "accuracy": 0.915,
        "precision": 0.908,
        "recall": 0.912,
        "f1_score": 0.910,
        "auc_roc": 0.962,
        "latency_ms": 11.5,
        "parameters": "12.8M",
        "is_active": False,
        "xai_supported": True,
        "status": "Trained",
    },
    {
        "id": "model_sensor_only",
        "name": "Sensor-Only Baseline",
        "architecture": "1D CNN + BiLSTM",
        "modality": "sensor",
        "fusion_method": "none",
        "accuracy": 0.862,
        "precision": 0.854,
        "recall": 0.859,
        "f1_score": 0.856,
        "auc_roc": 0.921,
        "latency_ms": 4.1,
        "parameters": "1.2M",
        "is_active": False,
        "xai_supported": True,
        "status": "Trained Baseline",
    },
    {
        "id": "model_vision_only",
        "name": "Vision-Only Baseline",
        "architecture": "ResNet18 Fine-Tuned",
        "modality": "vision",
        "fusion_method": "none",
        "accuracy": 0.794,
        "precision": 0.785,
        "recall": 0.790,
        "f1_score": 0.787,
        "auc_roc": 0.868,
        "latency_ms": 9.8,
        "parameters": "11.2M",
        "is_active": False,
        "xai_supported": True,
        "status": "Trained Baseline",
    },
    {
        "id": "model_blackbox_fusion",
        "name": "Black-Box Fusion Baseline (No XAI)",
        "architecture": "Naive Concat MLP",
        "modality": "multimodal",
        "fusion_method": "concat",
        "accuracy": 0.884,
        "precision": 0.875,
        "recall": 0.880,
        "f1_score": 0.877,
        "auc_roc": 0.932,
        "latency_ms": 10.2,
        "parameters": "12.5M",
        "is_active": False,
        "xai_supported": False,
        "status": "Ablation Baseline",
    },
]


@router.get("")
def list_models():
    """Returns list of registered and compared models."""
    return _MODELS_REGISTRY


@router.get("/comparison")
def get_model_comparison():
    """Returns comparative metrics table and chart data."""
    chart_data = []
    for m in _MODELS_REGISTRY:
        chart_data.append({
            "name": m["name"].split(" ")[0] + (" (Cross-Attn)" if "Cross" in m["name"] else ""),
            "accuracy": round(m["accuracy"] * 100, 1),
            "f1_score": round(m["f1_score"] * 100, 1),
            "auc": round(m["auc_roc"] * 100, 1),
            "latency": m["latency_ms"],
        })
    return {
        "models": _MODELS_REGISTRY,
        "chart_data": chart_data,
        "summary": "Cross-Attention Multimodal Fusion demonstrates +3.3% accuracy over Concatenation Fusion and +8.6% over the Sensor-only baseline, while preserving sub-15ms real-time inference latency.",
    }
