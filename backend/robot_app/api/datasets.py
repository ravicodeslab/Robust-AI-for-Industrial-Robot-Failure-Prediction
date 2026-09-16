"""
Dataset Management API Endpoints.
Allows:
- Sensor CSV upload & column inspection
- Image folder / ZIP upload
- Dynamic column mapping
- Data validation and preprocessing status
"""
from __future__ import annotations

from datetime import datetime, timezone
import os
from pathlib import Path
import shutil
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
import pandas as pd

from robot_app.core.config import get_settings

router = APIRouter(prefix="/datasets", tags=["Datasets"])
settings = get_settings()

# In-memory registry of datasets for prototype (plus file storage)
_DATASETS_REGISTRY: List[Dict[str, Any]] = [
    {
        "id": "ds_demo_sensor",
        "name": "CWRU-Style Bearing Vibration Benchmark",
        "modality": "sensor",
        "data_type": "BENCHMARK MULTIMODAL PAIRING",
        "file_path": "data/sensor/cwru_benchmark.csv",
        "sample_count": 4800,
        "columns": ["timestamp", "vibration", "current", "temperature", "label"],
        "detected_mapping": {
            "timestamp": "timestamp",
            "vibration": "vibration",
            "current": "current",
            "temperature": "temperature",
            "label": "label",
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "ds_demo_vision",
        "name": "MVTec AD-Style Surface Defect Benchmark",
        "modality": "vision",
        "data_type": "BENCHMARK MULTIMODAL PAIRING",
        "file_path": "data/vision/mvtec_benchmark",
        "sample_count": 1250,
        "columns": ["image_id", "defect_type", "surface_area"],
        "detected_mapping": {"defect_type": "label"},
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "ds_synthetic_demo",
        "name": "Synthetic Industrial Robot Continuous Run",
        "modality": "multimodal",
        "data_type": "DEMO DATA",
        "file_path": "data/processed/synthetic_run.parquet",
        "sample_count": 10000,
        "columns": ["timestamp", "vibration", "current", "temperature", "inspection_frame", "label"],
        "detected_mapping": {
            "vibration": "vibration",
            "current": "current",
            "temperature": "temperature",
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
]


@router.get("")
def list_datasets():
    """List all registered datasets with provenance tag."""
    return _DATASETS_REGISTRY


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    modality: str = Form(...),  # sensor, vision, multimodal
    data_type: str = Form("REAL"),  # REAL, BENCHMARK, DEMO
):
    """
    Upload CSV, Parquet, or image archive.
    Inspects columns and returns suggested mapping.
    """
    dest_dir = Path("data") / modality
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    file_id = f"ds_{uuid.uuid4().hex[:8]}"
    file_path = dest_dir / f"{file_id}_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    detected_cols = []
    suggested_map = {}
    sample_count = 0

    if file.filename.endswith((".csv", ".txt")):
        try:
            df = pd.read_csv(file_path, nrows=100)
            detected_cols = list(df.columns)
            sample_count = len(pd.read_csv(file_path, usecols=[0]))
            
            # Simple heuristic mapping
            for col in detected_cols:
                lower = col.lower()
                if "vib" in lower:
                    suggested_map["vibration"] = col
                elif "curr" in lower or "amp" in lower:
                    suggested_map["current"] = col
                elif "temp" in lower or "deg" in lower:
                    suggested_map["temperature"] = col
                elif "time" in lower or "date" in lower:
                    suggested_map["timestamp"] = col
                elif "label" in lower or "class" in lower or "target" in lower:
                    suggested_map["label"] = col
        except Exception as e:
            detected_cols = ["Error parsing file: " + str(e)]

    new_entry = {
        "id": file_id,
        "name": name,
        "modality": modality,
        "data_type": data_type,
        "file_path": str(file_path),
        "sample_count": sample_count,
        "columns": detected_cols,
        "detected_mapping": suggested_map,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _DATASETS_REGISTRY.append(new_entry)
    return new_entry
