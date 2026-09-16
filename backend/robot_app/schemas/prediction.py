"""
Pydantic schemas for predictions, sensor data, and inference responses.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SensorReading(BaseModel):
    timestamp: Optional[float] = None
    vibration: float = Field(..., description="Vibration RMS/amplitude")
    current: float = Field(..., description="Motor current in Amperes")
    temperature: float = Field(..., description="Operating temperature in Celsius")
    vibration_x: Optional[float] = None
    vibration_y: Optional[float] = None
    vibration_z: Optional[float] = None


class SensorWindowInput(BaseModel):
    robot_id: str = "Robot-01"
    sequence: List[SensorReading] = Field(..., description="Time series window of sensor readings")
    noise_level: Optional[float] = Field(0.0, ge=0.0, le=1.0)
    dropout_rate: Optional[float] = Field(0.0, ge=0.0, le=1.0)


class VisionInput(BaseModel):
    robot_id: str = "Robot-01"
    image_base64: Optional[str] = Field(None, description="Base64 encoded JPEG/PNG image")
    image_path: Optional[str] = Field(None, description="Path to image on server/disk")


class MultimodalInput(BaseModel):
    robot_id: str = "Robot-01"
    sensor_window: Optional[List[SensorReading]] = None
    image_base64: Optional[str] = None
    image_path: Optional[str] = None
    fusion_method: Optional[str] = Field("cross_attention", description="concat or cross_attention")
    noise_level: Optional[float] = Field(0.0, ge=0.0, le=1.0)
    sensor_dropout: Optional[float] = Field(0.0, ge=0.0, le=1.0)


class ShapFactor(BaseModel):
    feature: str
    contribution: float
    value: float


class PredictionResponse(BaseModel):
    id: str
    robot_id: str
    timestamp: datetime
    failure_class: str
    confidence: float
    affected_component: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    probabilities: Dict[str, float]
    data_mode: str  # DEMO DATA, BENCHMARK MULTIMODAL PAIRING, REAL EXPERIMENTAL DATA
    modality_used: str  # multimodal, sensor_only, vision_only
    robustness_status: str  # GOOD, WARNING, SEVERE_DEGRADATION
    recommended_action: str
    safety_reason: str
    triggered_rules: List[str]
    top_contributing_factors: Optional[List[ShapFactor]] = None
    gradcam_overlay_base64: Optional[str] = None
    is_anomaly: bool = False
