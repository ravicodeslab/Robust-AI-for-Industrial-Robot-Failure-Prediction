"""
Core configuration loader.
Reads config/config.yaml and environment variables.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


# ---------------------------------------------------------------------------
# Locate project root (two levels up from backend/app/core/)
# ---------------------------------------------------------------------------
_HERE = Path(__file__).resolve()
_BACKEND_DIR = _HERE.parent.parent.parent        # backend/
_PROJECT_ROOT = _BACKEND_DIR.parent              # project root


def _load_yaml(path: Path) -> Dict[str, Any]:
    """Load YAML file and return dict. Return empty dict if not found."""
    if path.exists():
        with open(path, "r", encoding="utf-8") as fh:
            return yaml.safe_load(fh) or {}
    return {}


class Settings(BaseSettings):
    """Application settings with YAML + env-var override support."""

    # ---- Identity ---------------------------------------------------------
    app_name: str = "Industrial Robot AI Safety Console"
    app_version: str = "1.0.0"
    debug: bool = False
    demo_mode: bool = True

    # ---- Server -----------------------------------------------------------
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:80",
    ]

    # ---- Database ---------------------------------------------------------
    database_url: str = f"sqlite:///{_PROJECT_ROOT}/data/robot_safety.db"

    # ---- Paths (relative to project root) ---------------------------------
    project_root: Path = _PROJECT_ROOT
    config_path: Path = _PROJECT_ROOT / "config" / "config.yaml"
    data_dir: Path = _PROJECT_ROOT / "data"
    models_dir: Path = _PROJECT_ROOT / "models"
    results_dir: Path = _PROJECT_ROOT / "results"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


@lru_cache()
def get_yaml_config() -> Dict[str, Any]:
    """Return full parsed config.yaml as a dict."""
    cfg_path = get_settings().config_path
    return _load_yaml(cfg_path)


def get_failure_classes() -> List[str]:
    cfg = get_yaml_config()
    return cfg.get("failure_classes", [
        "Normal", "Bearing Failure", "Motor Failure",
        "Sensor Fault", "Overheating", "Mechanical Wear",
        "Misalignment", "Other Failure",
    ])


def get_component_mapping() -> Dict[str, str]:
    cfg = get_yaml_config()
    return cfg.get("component_mapping", {})


def get_severity_mapping() -> Dict[str, str]:
    cfg = get_yaml_config()
    return cfg.get("severity_mapping", {})


def get_safety_config() -> Dict[str, Any]:
    cfg = get_yaml_config()
    return cfg.get("safety", {})


def get_model_config() -> Dict[str, Any]:
    cfg = get_yaml_config()
    return cfg.get("model", {})


def get_training_config() -> Dict[str, Any]:
    cfg = get_yaml_config()
    return cfg.get("training", {})


def get_demo_config() -> Dict[str, Any]:
    cfg = get_yaml_config()
    return cfg.get("demo", {})


def get_robustness_config() -> Dict[str, Any]:
    cfg = get_yaml_config()
    return cfg.get("robustness", {})


def get_xai_config() -> Dict[str, Any]:
    cfg = get_yaml_config()
    return cfg.get("xai", {})
