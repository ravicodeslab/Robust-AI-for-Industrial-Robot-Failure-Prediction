"""
Schemas for robustness testing, experiments, and datasets.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# --- Robustness ---
class RobustnessTestRequest(BaseModel):
    model_id: Optional[str] = None
    noise_levels: List[float] = [0.0, 0.1, 0.2, 0.3, 0.4]
    dropout_levels: List[float] = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5]
    test_missing_modality: bool = True
    dataset_name: Optional[str] = "Demo Benchmark Suite"


class RobustnessPoint(BaseModel):
    level: float
    accuracy: float
    f1: float
    auc: Optional[float] = None
    confidence_avg: float


class RobustnessTestResponse(BaseModel):
    test_id: str
    model_architecture: str
    noise_curve: List[RobustnessPoint]
    dropout_curve: List[RobustnessPoint]
    missing_modality_results: Dict[str, Dict[str, float]]
    timestamp: datetime
    summary: str


# --- Dataset ---
class DatasetUploadResponse(BaseModel):
    id: str
    name: str
    modality: str
    data_type: str  # DEMO, BENCHMARK, REAL
    file_path: str
    sample_count: int
    columns: List[str]
    detected_mapping: Dict[str, str]
    created_at: datetime


class DatasetValidateRequest(BaseModel):
    dataset_id: str
    column_mapping: Dict[str, str]


# --- Experiments ---
class ExperimentItem(BaseModel):
    id: str
    name: str
    experiment_code: str
    model_architecture: str
    dataset_name: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    auc_score: Optional[float] = None
    noise_level: float = 0.0
    dropout_level: float = 0.0
    missing_modality: str = "none"
    status: str
    created_at: datetime
