"""
Safety Decision API Endpoints.
Audit and rule inspection for transparent industrial safety actions.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from robot_app.core.config import get_safety_config
from robot_app.ml.predictor import predictor
from robot_app.schemas.safety import (
    SafetyDecisionRequest,
    SafetyDecisionResponse,
    SafetyRuleEvaluation,
)

router = APIRouter(prefix="/safety", tags=["Safety Engine"])


@router.post("/decision", response_model=SafetyDecisionResponse)
def evaluate_safety_decision(req: SafetyDecisionRequest):
    """
    Evaluates transparent safety rules given prediction risk,
    severity, and robustness conditions.
    """
    res = predictor.safety_engine.evaluate(
        failure_class=req.failure_class,
        confidence=req.confidence,
        severity=req.severity,
        robustness_status=req.robustness_status,
        sensor_missing=req.sensor_missing,
        vision_missing=req.vision_missing,
        sensor_features=req.sensor_features,
    )

    evaluations = [
        SafetyRuleEvaluation(
            rule_id="R001",
            condition_description="Failure risk < 30% AND Severity == LOW",
            triggered=res["rule_id"] == "R001",
            action_if_triggered="CONTINUE OPERATION",
            evaluated_values={"confidence": req.confidence, "severity": req.severity},
        ),
        SafetyRuleEvaluation(
            rule_id="R002",
            condition_description="Failure risk between 30% and 60%",
            triggered=res["rule_id"] == "R002",
            action_if_triggered="SCHEDULE MAINTENANCE",
            evaluated_values={"confidence": req.confidence},
        ),
        SafetyRuleEvaluation(
            rule_id="R003",
            condition_description="Failure risk >= 80% AND Severity == HIGH",
            triggered=res["rule_id"] == "R003",
            action_if_triggered="REDUCE SPEED",
            evaluated_values={"confidence": req.confidence, "severity": req.severity},
        ),
        SafetyRuleEvaluation(
            rule_id="R004",
            condition_description="Failure risk >= 90% AND Severity == CRITICAL",
            triggered=res["rule_id"] == "R004",
            action_if_triggered="IMMEDIATE HALT",
            evaluated_values={"confidence": req.confidence, "severity": req.severity},
        ),
        SafetyRuleEvaluation(
            rule_id="R005",
            condition_description="Robustness status == SEVERE_DEGRADATION",
            triggered=res["rule_id"] == "R005",
            action_if_triggered="DEGRADED / VERIFY MANUALLY",
            evaluated_values={"robustness": req.robustness_status},
        ),
    ]

    return SafetyDecisionResponse(
        action=res["action"],
        confidence=res["confidence"],
        severity=res["severity"],
        robustness_status=res["robustness_status"],
        audit_reason=res["audit_reason"],
        triggered_rules=res["triggered_rules"],
        rule_evaluations=evaluations,
        timestamp=datetime.now(timezone.utc),
        is_degraded=res["is_degraded"],
        requires_manual_inspection=res["requires_manual_inspection"],
    )


@router.get("/rules")
def get_configured_rules():
    """Returns the active configurable rule set and thresholds."""
    cfg = get_safety_config()
    return {
        "thresholds": {
            "continue_threshold": cfg.get("continue_threshold", 0.30),
            "maintenance_threshold": cfg.get("maintenance_threshold", 0.60),
            "reduce_speed_threshold": cfg.get("reduce_speed_threshold", 0.80),
            "halt_threshold": cfg.get("halt_threshold", 0.90),
            "missing_modality_penalty": cfg.get("missing_modality_confidence_penalty", 0.15),
        },
        "rules": cfg.get("rules", []),
        "disclaimer": (
            "Research Prototype: Decisions and actions are for decision support only. "
            "Real deployment requires industrial safety certification."
        ),
    }
