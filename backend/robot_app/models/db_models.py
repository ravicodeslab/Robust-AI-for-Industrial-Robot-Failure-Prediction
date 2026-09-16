"""
SQLAlchemy ORM models for database persistence.
Tables:
- robots
- datasets
- models (trained models)
- predictions
- alerts
- experiments
- safety_decisions
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from robot_app.core.database import Base


class Robot(Base):
    __tablename__ = "robots"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    model_type = Column(String(128), default="6-DOF Industrial Arm")
    status = Column(String(32), default="OPERATIONAL")  # OPERATIONAL, WARNING, HALTED, MAINTENANCE
    location = Column(String(128), default="Cell-04 / Assembly Line")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    predictions = relationship("Prediction", back_populates="robot", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="robot", cascade="all, delete-orphan")


class DatasetRecord(Base):
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    modality = Column(String(32), nullable=False)  # sensor, vision, multimodal
    data_type = Column(String(32), default="DEMO")  # DEMO, BENCHMARK, REAL
    file_path = Column(String(512), nullable=False)
    sample_count = Column(Integer, default=0)
    column_mapping = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)


class TrainedModel(Base):
    __tablename__ = "models"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    architecture = Column(String(64), nullable=False)  # cnn_lstm, resnet18, fusion_concat, fusion_attention
    modality = Column(String(32), nullable=False)  # sensor, vision, multimodal
    fusion_method = Column(String(32), nullable=True)  # concat, cross_attention, none
    file_path = Column(String(512), nullable=False)
    metrics = Column(Text, nullable=True)  # JSON string with acc, precision, recall, f1, auc
    dataset_name = Column(String(128), default="Synthetic Demo")
    epochs = Column(Integer, default=30)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(64), primary_key=True, index=True)
    robot_id = Column(String(64), ForeignKey("robots.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    model_id = Column(String(64), nullable=True)
    modality_used = Column(String(32), default="multimodal")  # multimodal, sensor_only, vision_only
    failure_class = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False)
    affected_component = Column(String(64), default="Unknown")
    severity = Column(String(32), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    probabilities = Column(Text, nullable=True)  # JSON string of class -> float
    data_mode = Column(String(32), default="DEMO DATA")  # DEMO DATA, BENCHMARK MULTIMODAL PAIRING, REAL EXPERIMENTAL DATA
    robustness_status = Column(String(32), default="GOOD")  # GOOD, WARNING, SEVERE_DEGRADATION
    sensor_features = Column(Text, nullable=True)  # JSON string of input sensor features
    image_path = Column(String(512), nullable=True)
    shap_explanation = Column(Text, nullable=True)  # JSON string of top features & values
    gradcam_path = Column(String(512), nullable=True)
    
    robot = relationship("Robot", back_populates="predictions")
    safety_decision = relationship("SafetyDecision", back_populates="prediction", uselist=False)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, index=True)
    robot_id = Column(String(64), ForeignKey("robots.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    alert_type = Column(String(64), default="FAILURE_RISK")
    severity = Column(String(32), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    prediction_class = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False)
    recommended_action = Column(String(64), nullable=False)
    status = Column(String(32), default="ACTIVE")  # ACTIVE, ACKNOWLEDGED, RESOLVED
    message = Column(Text, nullable=False)

    robot = relationship("Robot", back_populates="alerts")


class SafetyDecision(Base):
    __tablename__ = "safety_decisions"

    id = Column(String(64), primary_key=True, index=True)
    prediction_id = Column(String(64), ForeignKey("predictions.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    recommended_action = Column(String(64), nullable=False)  # CONTINUE OPERATION, REDUCE SPEED, SCHEDULE MAINTENANCE, IMMEDIATE HALT, DEGRADED / VERIFY MANUALLY
    confidence = Column(Float, nullable=False)
    severity = Column(String(32), nullable=False)
    robustness_status = Column(String(32), nullable=False)
    triggered_rules = Column(Text, nullable=False)  # JSON list of rule descriptions
    audit_reason = Column(Text, nullable=False)

    prediction = relationship("Prediction", back_populates="safety_decision")


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    experiment_code = Column(String(32), nullable=False)  # Exp_A to Exp_J
    model_architecture = Column(String(64), nullable=False)
    dataset_name = Column(String(128), nullable=False)
    noise_level = Column(Float, default=0.0)
    dropout_level = Column(Float, default=0.0)
    missing_modality = Column(String(32), default="none")  # none, sensor, vision
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    auc_score = Column(Float, nullable=True)
    metrics_json = Column(Text, nullable=True)
    status = Column(String(32), default="COMPLETED")  # PENDING, RUNNING, COMPLETED, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)
