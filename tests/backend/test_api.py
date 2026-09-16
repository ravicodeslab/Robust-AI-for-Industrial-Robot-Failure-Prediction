"""
Integration tests for FastAPI backend endpoints.
Verifies:
- Health check
- Multimodal prediction (with demo fallback)
- SHAP and Grad-CAM explainability endpoints
- Safety decision endpoint
- Robustness evaluation endpoint
- Model listing and experiments
"""
from fastapi.testclient import TestClient
import pytest
import sys
from pathlib import Path

# Add project root and backend to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from robot_app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "memory_usage_percent" in data


def test_predict_demo_multimodal():
    # Empty input triggers demo mode synthesis
    response = client.post("/api/predict", json={})
    assert response.status_code == 200
    data = response.json()
    assert "failure_class" in data
    assert "confidence" in data
    assert "recommended_action" in data
    assert data["data_mode"] == "DEMO DATA"


def test_explain_shap():
    response = client.post("/api/explain/shap", params={"failure_class": "Bearing Failure"})
    assert response.status_code == 200
    data = response.json()
    assert "features" in data
    assert len(data["features"]) > 0
    assert "summary_text" in data


def test_explain_gradcam():
    response = client.post("/api/explain/gradcam", params={"failure_class": "Bearing Failure"})
    assert response.status_code == 200
    data = response.json()
    assert "original_image_base64" in data
    assert "overlay_base64" in data
    assert "attention_region_description" in data


def test_safety_decision_endpoint():
    req = {
        "failure_class": "Bearing Failure",
        "confidence": 0.85,
        "severity": "HIGH",
        "robustness_status": "GOOD",
    }
    response = client.post("/api/safety/decision", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "REDUCE SPEED"
    assert len(data["triggered_rules"]) > 0


def test_models_list():
    response = client.get("/api/models")
    assert response.status_code == 200
    models = response.json()
    assert len(models) >= 4


def test_experiments_list():
    response = client.get("/api/experiments")
    assert response.status_code == 200
    exps = response.json()
    assert len(exps) >= 10
