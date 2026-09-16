"""
FastAPI Main Application Entry Point.
Explainable and Robust AI for Failure Prediction and Safety Decision Support
in Autonomous Industrial Robots.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure project root and backend are on sys.path regardless of execution CWD
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
if str(_PROJECT_ROOT / "backend") not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT / "backend"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from robot_app.api import (
    alerts,
    datasets,
    experiments,
    explain,
    health,
    models,
    predict,
    robustness,
    safety,
    train,
)
from robot_app.core.config import get_settings
from robot_app.core.database import create_all_tables
from robot_app.core.logging_config import logger

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle handler."""
    logger.info("Initializing Industrial Robot AI Safety Console backend...")
    # Create DB tables if not present
    try:
        create_all_tables()
        logger.info("Database schema initialized.")
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

    logger.info(f"System ready in {'DEMO MODE' if settings.demo_mode else 'PRODUCTION MODE'}.")
    yield
    logger.info("Shutting down backend services.")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Research prototype providing explainable failure prediction, multimodal sensor/vision "
        "feature fusion, SHAP/Grad-CAM explanations, robustness testing, and transparent rule-based "
        "safety decision support for autonomous industrial robotics."
    ),
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open for development / Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api
from fastapi import APIRouter

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(predict.router)
api_router.include_router(explain.router)
api_router.include_router(robustness.router)
api_router.include_router(safety.router)
api_router.include_router(datasets.router)
api_router.include_router(train.router)
api_router.include_router(models.router)
api_router.include_router(experiments.router)
api_router.include_router(alerts.router)

app.include_router(api_router)

# Mount compiled Vite frontend assets if present
_FRONTEND_DIST = settings.project_root / "frontend" / "dist"
if (_FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(_FRONTEND_DIST / "assets")), name="frontend_assets")


@app.get("/")
def root():
    index_file = _FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "ONLINE",
        "docs_url": "/docs",
        "demo_mode": settings.demo_mode,
        "disclaimer": (
            "Research Prototype: Predictions and recommended actions are for decision support "
            "only and require validation before deployment in safety-critical industrial environments."
        ),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("robot_app.main:app", host=settings.api_host, port=settings.api_port, reload=True)
