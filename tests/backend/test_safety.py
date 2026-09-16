"""
Unit tests for rule-based safety decision support engine.
Tests rules: R001 (Continue), R002 (Schedule Maintenance), R003 (Reduce Speed),
R004 (Immediate Halt), R005 (Degraded/Manual Verify).
"""
import pytest
from ml.safety.rules import SafetyDecisionEngine


@pytest.fixture
def engine():
    return SafetyDecisionEngine({
        "continue_threshold": 0.30,
        "maintenance_threshold": 0.60,
        "reduce_speed_threshold": 0.80,
        "halt_threshold": 0.90,
        "missing_modality_confidence_penalty": 0.15,
    })


def test_rule_r001_continue_operation(engine):
    res = engine.evaluate(
        failure_class="Normal",
        confidence=0.15,
        severity="LOW",
        robustness_status="GOOD",
    )
    assert res["action"] == "CONTINUE OPERATION"
    assert res["rule_id"] == "R001"
    assert not res["is_degraded"]


def test_rule_r002_schedule_maintenance(engine):
    res = engine.evaluate(
        failure_class="Sensor Fault",
        confidence=0.65,
        severity="MEDIUM",
        robustness_status="GOOD",
    )
    assert res["action"] == "SCHEDULE MAINTENANCE"
    assert res["rule_id"] == "R002"


def test_rule_r003_reduce_speed(engine):
    res = engine.evaluate(
        failure_class="Bearing Failure",
        confidence=0.85,
        severity="HIGH",
        robustness_status="GOOD",
    )
    assert res["action"] == "REDUCE SPEED"
    assert res["rule_id"] == "R003"


def test_rule_r004_immediate_halt(engine):
    res = engine.evaluate(
        failure_class="Overheating",
        confidence=0.94,
        severity="CRITICAL",
        robustness_status="GOOD",
    )
    assert res["action"] == "IMMEDIATE HALT"
    assert res["rule_id"] == "R004"
    assert res["requires_manual_inspection"]


def test_rule_r005_severe_degradation(engine):
    res = engine.evaluate(
        failure_class="Normal",
        confidence=0.20,
        severity="LOW",
        robustness_status="SEVERE_DEGRADATION",
    )
    assert res["action"] == "DEGRADED / VERIFY MANUALLY"
    assert res["rule_id"] == "R005"
    assert res["is_degraded"]
