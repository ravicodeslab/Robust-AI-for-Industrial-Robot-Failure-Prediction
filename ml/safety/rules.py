"""
Transparent Rule-Based Safety Decision Support Engine.
Generates fully auditable safety recommendations based on model prediction,
confidence, failure severity, and input robustness/modality availability.
Uses configurable rules from config/config.yaml rather than black-box decisions.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple


SAFETY_DISCLAIMER = (
    "Research Prototype: Predictions and recommended actions are for decision "
    "support only and require validation before deployment in safety-critical industrial environments."
)


class SafetyDecisionEngine:
    def __init__(self, safety_config: Optional[Dict[str, Any]] = None):
        cfg = safety_config or {}
        self.continue_threshold = cfg.get("continue_threshold", 0.30)
        self.maintenance_threshold = cfg.get("maintenance_threshold", 0.60)
        self.reduce_speed_threshold = cfg.get("reduce_speed_threshold", 0.80)
        self.halt_threshold = cfg.get("halt_threshold", 0.90)
        self.missing_modality_penalty = cfg.get("missing_modality_confidence_penalty", 0.15)
        self.min_confidence_threshold = cfg.get("min_confidence_threshold", 0.50)

    def evaluate(
        self,
        failure_class: str,
        confidence: float,
        severity: str,
        robustness_status: str = "GOOD",
        sensor_missing: bool = False,
        vision_missing: bool = False,
        sensor_features: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate safety rules against current inference state.
        Returns auditable decision dictionary.
        """
        triggered_rules: List[str] = []
        rule_evaluations: List[Dict[str, Any]] = []

        # Adjust effective confidence if a modality is missing
        effective_confidence = confidence
        if sensor_missing or vision_missing:
            effective_confidence = max(0.0, confidence - self.missing_modality_penalty)
            triggered_rules.append(
                f"Modality degradation penalty applied: -{self.missing_modality_penalty:.2f} "
                f"(raw: {confidence:.1%}, effective: {effective_confidence:.1%})"
            )

        # Check for specific sensor threshold breaches
        vibration_alert = False
        temp_alert = False
        if sensor_features:
            vib_rms = sensor_features.get("vibration_rms", 0.0)
            temp_max = sensor_features.get("temperature_max", 0.0)
            if vib_rms > 0.40:
                vibration_alert = True
                triggered_rules.append(f"High vibration anomaly detected (RMS: {vib_rms:.3f})")
            if temp_max > 65.0:
                temp_alert = True
                triggered_rules.append(f"Elevated thermal boundary detected (Max: {temp_max:.1f}°C)")

        # Rule evaluation logic (ordered by severity and safety priority)
        # 1. Severe Robustness or Missing Modality Overrides
        if robustness_status == "SEVERE_DEGRADATION":
            action = "DEGRADED / VERIFY MANUALLY"
            rule_id = "R005"
            reason = (
                "Severe sensor or vision signal degradation detected. Predictive confidence cannot "
                "be verified. Autonomous control recommends manual inspection before proceeding."
            )
            triggered_rules.append("Rule R005: Robustness status == SEVERE_DEGRADATION")
            is_degraded = True
            requires_manual = True

        # 2. Critical Emergency Halt
        elif (
            (severity == "CRITICAL" and effective_confidence >= self.halt_threshold)
            or (failure_class == "Overheating" and temp_alert and effective_confidence >= 0.70)
        ):
            action = "IMMEDIATE HALT"
            rule_id = "R004"
            reason = (
                f"Critical failure ({failure_class}) predicted with {effective_confidence:.1%} confidence. "
                "Immediate safety risk to equipment or personnel. Robot motion halted immediately."
            )
            triggered_rules.append(
                f"Rule R004: Severity == CRITICAL AND Confidence ({effective_confidence:.1%}) >= {self.halt_threshold:.1%}"
            )
            is_degraded = False
            requires_manual = True

        # 3. High Severity Speed Reduction
        elif severity == "HIGH" and effective_confidence >= self.reduce_speed_threshold:
            action = "REDUCE SPEED"
            rule_id = "R003"
            reason = (
                f"High-confidence {failure_class} prediction ({effective_confidence:.1%}) with elevated mechanical stress. "
                "Operating speed restricted to 25% to minimize component wear pending maintenance intervention."
            )
            triggered_rules.append(
                f"Rule R003: Severity == HIGH AND Confidence ({effective_confidence:.1%}) >= {self.reduce_speed_threshold:.1%}"
            )
            is_degraded = False
            requires_manual = False

        # 4. Scheduled Maintenance
        elif effective_confidence >= self.maintenance_threshold:
            action = "SCHEDULE MAINTENANCE"
            rule_id = "R002"
            reason = (
                f"Moderate failure probability ({effective_confidence:.1%}) indicating nascent {failure_class.lower()}. "
                "Schedule preventative inspection within the next 24 operating hours."
            )
            triggered_rules.append(
                f"Rule R002: Confidence ({effective_confidence:.1%}) >= {self.maintenance_threshold:.1%}"
            )
            is_degraded = False
            requires_manual = False

        # 5. Normal Continue Operation
        elif (
            failure_class == "Normal"
            or (effective_confidence < self.continue_threshold and severity == "LOW")
        ):
            action = "CONTINUE OPERATION"
            rule_id = "R001"
            reason = (
                f"System within normal operating envelope. Failure risk ({effective_confidence:.1%}) "
                f"is below continue threshold ({self.continue_threshold:.1%})."
            )
            triggered_rules.append(
                f"Rule R001: Failure risk < {self.continue_threshold:.1%} AND severity == LOW"
            )
            is_degraded = False
            requires_manual = False

        # Fallback conservative rule
        else:
            action = "SCHEDULE MAINTENANCE"
            rule_id = "R000"
            reason = (
                f"Ambiguous risk profile for {failure_class} with confidence {effective_confidence:.1%}. "
                "Adopting conservative maintenance schedule."
            )
            triggered_rules.append("Rule R000: Default conservative safety fallthrough")
            is_degraded = False
            requires_manual = False

        return {
            "action": action,
            "rule_id": rule_id,
            "confidence": effective_confidence,
            "raw_confidence": confidence,
            "severity": severity,
            "robustness_status": robustness_status,
            "triggered_rules": triggered_rules,
            "audit_reason": reason,
            "is_degraded": is_degraded,
            "requires_manual_inspection": requires_manual,
            "disclaimer": SAFETY_DISCLAIMER,
        }
