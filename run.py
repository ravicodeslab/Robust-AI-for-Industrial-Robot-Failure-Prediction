"""
Launcher for Industrial Robot AI Safety Console.
Starts FastAPI backend server, which also serves the compiled React frontend SPA at http://localhost:8000.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Explicitly ensure this project and its backend precede any system PYTHONPATH entries
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

if __name__ == "__main__":
    import uvicorn
    from robot_app.core.config import get_settings
    from robot_app.main import app

    settings = get_settings()
    print("=" * 70)
    print(f"Starting {settings.app_name} v{settings.app_version}")
    print(f"API Docs available at: http://localhost:{settings.api_port}/docs")
    print(f"Full Console UI available at: http://localhost:{settings.api_port}/")
    print("=" * 70)

    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
