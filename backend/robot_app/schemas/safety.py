"""
Schemas for safety decision support, audits, and rules.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SafetyRuleEvaluation(BaseModel):
    rule_id: str
    condition_description: str
    triggered: bool
    action_if_triggered: str
    evaluated_values: Dict[str, Any]


class SafetyDecisionRequest(BaseModel):
    failure_class: str
    confidence: float
    severity: str
    robustness_status: str = "GOOD"
    sensor_missing: bool = False
    vision_missing: bool = False
    sensor_features: Optional[Dict[str, float]] = None


class SafetyDecisionResponse(BaseModel):
    action: str  # CONTINUE OPERATION, REDUCE SPEED, SCHEDULE MAINTENANCE, IMMEDIATE HALT, DEGRADED / VERIFY MANUALLY
    confidence: float
    severity: str
    robustness_status: str
    audit_reason: str
    triggered_rules: List[str]
    rule_evaluations: List[SafetyRuleEvaluation]
    timestamp: datetime
    is_degraded: bool
    requires_manual_inspection: bool
