"""
Industrial Alerts API Endpoints.
Allows monitoring and acknowledging critical predictive failure alerts.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/alerts", tags=["Alerts"])

_ALERTS_STORE: List[Dict[str, Any]] = [
    {
        "id": "alt_001",
        "robot_id": "Robot-01",
        "timestamp": "2026-09-14 14:32:18",
        "alert_type": "CRITICAL_FAILURE_RISK",
        "severity": "HIGH",
        "prediction_class": "Bearing Failure",
        "confidence": 0.914,
        "affected_component": "Bearing assembly (Joint 2)",
        "recommended_action": "REDUCE SPEED",
        "detected_anomaly": "Abnormal high-frequency vibration harmonic (BPFO = 107.4 Hz)",
        "status": "ACTIVE",  # ACTIVE, ACKNOWLEDGED, RESOLVED
    },
    {
        "id": "alt_002",
        "robot_id": "Robot-01",
        "timestamp": "2026-09-14 13:10:05",
        "alert_type": "THERMAL_GRADIENT_WARNING",
        "severity": "MEDIUM",
        "prediction_class": "Overheating",
        "confidence": 0.642,
        "affected_component": "Stator windings (Motor 3)",
        "recommended_action": "SCHEDULE MAINTENANCE",
        "detected_anomaly": "Temperature rose by +8.2°C over 15 minutes",
        "status": "ACKNOWLEDGED",
    },
]


@router.get("")
def list_alerts():
    """Returns list of active and recent robot alerts."""
    return _ALERTS_STORE


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    """Mark an alert as acknowledged by plant safety operator."""
    for alert in _ALERTS_STORE:
        if alert["id"] == alert_id:
            alert["status"] = "ACKNOWLEDGED"
            alert["acknowledged_at"] = datetime.now(timezone.utc).isoformat()
            return {"status": "SUCCESS", "message": f"Alert {alert_id} acknowledged."}
    raise HTTPException(status_code=404, detail="Alert not found.")
