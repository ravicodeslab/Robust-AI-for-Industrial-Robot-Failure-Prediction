"""
Prediction API Endpoints.
Supports:
- Sensor-only prediction
- Vision-only prediction
- Multimodal prediction (Concatenation or Cross-Attention)
- Live continuous sensor stream simulation
"""
from __future__ import annotations

import base64
import io
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
import numpy as np
from PIL import Image

from robot_app.core.config import get_failure_classes
from robot_app.ml.demo_generator import (
    base64_to_image,
    generate_synthetic_inspection_image,
    generate_synthetic_sensor_window,
    image_to_base64,
)
from robot_app.ml.predictor import predictor
from robot_app.schemas.prediction import (
    MultimodalInput,
    PredictionResponse,
    SensorReading,
    SensorWindowInput,
    VisionInput,
)

router = APIRouter(prefix="/predict", tags=["Prediction"])

# Simulation state tracker for continuous live demo mode
_sim_step = 0


@router.post("", response_model=PredictionResponse)
def predict_multimodal(req: MultimodalInput):
    """Unified multimodal failure prediction."""
    sensor_data = None
    sensor_feats = None

    if req.sensor_window and len(req.sensor_window) > 0:
        arr = []
        for r in req.sensor_window:
            arr.append([r.vibration, r.current, r.temperature])
        sensor_data = np.array(arr, dtype=np.float32)
        sensor_feats = {
            "vibration_rms": float(np.sqrt(np.mean(sensor_data[:, 0] ** 2))),
            "vibration_kurtosis": 4.5,
            "vibration_peak": float(np.max(np.abs(sensor_data[:, 0]))),
            "current_mean": float(np.mean(sensor_data[:, 1])),
            "current_std": float(np.std(sensor_data[:, 1])),
            "temperature_mean": float(np.mean(sensor_data[:, 2])),
            "temperature_gradient": float(sensor_data[-1, 2] - sensor_data[0, 2]),
        }

    image_pil = None
    if req.image_base64:
        try:
            image_pil = base64_to_image(req.image_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

    res = predictor.predict_multimodal(
        sensor_data=sensor_data,
        sensor_features=sensor_feats,
        image_pil=image_pil,
        fusion_method=req.fusion_method or "cross_attention",
        noise_level=req.noise_level or 0.0,
        dropout_rate=req.sensor_dropout or 0.0,
        is_demo=True if (sensor_data is None and image_pil is None) else False,
        robot_id=req.robot_id,
    )
    return res


@router.post("/sensor", response_model=PredictionResponse)
def predict_sensor(req: SensorWindowInput):
    """Sensor-only failure prediction."""
    arr = []
    for r in req.sequence:
        arr.append([r.vibration, r.current, r.temperature])
    sensor_data = np.array(arr, dtype=np.float32)

    res = predictor.predict_multimodal(
        sensor_data=sensor_data,
        image_pil=None,
        noise_level=req.noise_level or 0.0,
        dropout_rate=req.dropout_rate or 0.0,
        is_demo=False,
        robot_id=req.robot_id,
    )
    return res


@router.post("/vision", response_model=PredictionResponse)
def predict_vision(req: VisionInput):
    """Vision-only failure prediction."""
    if not req.image_base64 and not req.image_path:
        raise HTTPException(status_code=400, detail="Must provide image_base64 or image_path.")

    try:
        image_pil = base64_to_image(req.image_base64) if req.image_base64 else Image.open(req.image_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not load image: {str(e)}")

    res = predictor.predict_multimodal(
        sensor_data=None,
        image_pil=image_pil,
        is_demo=False,
        robot_id=req.robot_id,
    )
    return res


@router.get("/live")
def get_live_telemetry_stream():
    """
    Simulates real-time streaming sensor values and robot state.
    Generates dynamic progression: normal operating cycle followed by periodic
    nascent failure signature (elevated vibration & temperature).
    """
    global _sim_step
    _sim_step += 1

    # Simulate cyclical condition (normal -> progressive degradation -> maintenance trigger)
    cycle = (_sim_step // 8) % 3  # 0: Normal, 1: Degrading Bearing, 2: Overheating

    if cycle == 0:
        vib = round(0.12 + 0.03 * np.sin(_sim_step * 0.5) + np.random.uniform(-0.01, 0.02), 3)
        curr = round(2.1 + 0.1 * np.sin(_sim_step * 0.3) + np.random.uniform(-0.05, 0.05), 2)
        temp = round(42.0 + np.random.uniform(-0.3, 0.4), 1)
        risk = round(0.04 + np.random.uniform(0.0, 0.02), 3)
        state = "OPERATIONAL"
        failure_class = "Normal"
        action = "CONTINUE OPERATION"
    elif cycle == 1:
        # Increasing vibration & bearing wear
        vib = round(0.55 + 0.15 * np.sin(_sim_step * 0.8) + np.random.uniform(-0.05, 0.08), 3)
        curr = round(2.8 + 0.2 * np.sin(_sim_step * 0.4), 2)
        temp = round(52.5 + (_sim_step % 8) * 0.8, 1)
        risk = round(0.78 + np.random.uniform(0.0, 0.08), 3)
        state = "WARNING"
        failure_class = "Bearing Failure"
        action = "REDUCE SPEED"
    else:
        # High thermal escalation
        vib = round(0.38 + np.random.uniform(-0.02, 0.04), 3)
        curr = round(3.9 + np.random.uniform(-0.1, 0.2), 2)
        temp = round(74.0 + (_sim_step % 8) * 1.5, 1)
        risk = round(0.91 + np.random.uniform(0.0, 0.04), 3)
        state = "HIGH RISK"
        failure_class = "Overheating"
        action = "IMMEDIATE HALT"

    return {
        "step": _sim_step,
        "timestamp": time.time(),
        "vibration": vib,
        "current": curr,
        "temperature": temp,
        "failure_risk": risk,
        "robot_status": state,
        "predicted_failure": failure_class,
        "recommended_action": action,
        "data_mode": "DEMO SIMULATION STREAM",
    }
