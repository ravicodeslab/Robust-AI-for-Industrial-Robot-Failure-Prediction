"""
Health check and system telemetry endpoint.
"""
from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter
import psutil

from robot_app.core.config import get_settings

router = APIRouter(prefix="/health", tags=["Health"])
settings = get_settings()


@router.get("")
def health_check():
    return {
        "status": "ONLINE",
        "system": "Industrial Robot AI Safety Console",
        "version": settings.app_version,
        "demo_mode": settings.demo_mode,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "memory_usage_percent": psutil.virtual_memory().percent,
        "cpu_usage_percent": psutil.cpu_percent(interval=None),
    }
