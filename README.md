# 🤖 Robust AI for Industrial Robot Failure Prediction

> **Research Prototype** — Explainable, multimodal AI system for real-time failure prediction and transparent safety decision support in autonomous industrial robots.

[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://typescriptlang.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2-EE4C2C?logo=pytorch)](https://pytorch.org)
[![Tests](https://img.shields.io/badge/Tests-16%20Passed-brightgreen)](#testing)
[![License](https://img.shields.io/badge/License-MIT-yellow)](#license)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Quick Start](#quick-start)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running Experiments](#running-experiments)
- [API Reference](#api-reference)
- [Dashboard Modules](#dashboard-modules)
- [Testing](#testing)
- [Research Experiments](#research-experiments)
- [Results](#results)
- [Disclaimer](#disclaimer)

---

## Overview

This system provides a full-stack AI safety console for industrial robotic arms, combining:

- **Multimodal Sensor Fusion** — 1D CNN-LSTM (time-series vibration/current/temperature) + ResNet18 (optical camera inspection)
- **Cross-Attention Transformer Fusion** — dynamically weights sensor vs. visual modalities at inference time
- **Explainable AI (XAI)** — SHAP feature attributions for sensor telemetry + Grad-CAM spatial heatmaps for vision
- **Robustness Evaluation** — Gaussian noise injection, random sensor channel dropout, missing modality fallback
- **Transparent Safety Decisions** — deterministic rule-based guardrails (ISO 10218 / IEC 61508 aligned)
- **Interactive Research Dashboard** — 12-module React/TypeScript console for live monitoring, analysis, and training

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Industrial Robot Sensors                  │
│     Vibration (g)  │  Motor Current (A)  │  Temperature (°C)│
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼                             ▼
     ┌─────────────────┐        ┌─────────────────────┐
     │  1D CNN + BiLSTM│        │  ResNet18 (Vision)   │
     │  Sensor Encoder │        │  Camera Frame Encode │
     └────────┬────────┘        └──────────┬──────────┘
              │                            │
              └────────────┬───────────────┘
                           ▼
              ┌─────────────────────────┐
              │  Cross-Attention Fusion  │
              │  (Multi-Head Attention)  │
              └────────────┬────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐  ┌────────┐  ┌──────────────┐
        │ Failure  │  │  SHAP  │  │  Safety Rule  │
        │ Classifier│  │Grad-CAM│  │    Engine    │
        └──────────┘  └────────┘  └──────────────┘
              │
              ▼
     ┌──────────────────┐
     │  FastAPI Backend  │
     │  REST API (/api)  │
     └────────┬─────────┘
              │
     ┌────────▼─────────┐
     │  React Dashboard  │
     │  (Vite + TS)      │
     └───────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.12 | Core language |
| **FastAPI** | 0.111 | REST API framework |
| **PyTorch** | 2.2 | Neural network training & inference |
| **SHAP** | 0.45 | Kernel SHAP explainability for sensor features |
| **Grad-CAM** | Custom | Gradient-weighted class activation maps for vision |
| **NumPy / SciPy** | Latest | Signal processing & numerical computation |
| **Pillow** | Latest | Image generation & manipulation |
| **SQLite** | Built-in | Telemetry & experiment data storage |
| **Pydantic v2** | 2.x | Schema validation & serialization |
| **Uvicorn** | Latest | ASGI server |
| **Pytest** | 9.1 | Unit & integration testing |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.2 | UI framework |
| **TypeScript** | 5.3 | Type-safe JavaScript |
| **Vite** | 5.1 | Build tool & dev server |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **Recharts** | 2.x | Charting & data visualization |
| **Lucide React** | 0.344 | Icon library |
| **Axios** | 1.6 | HTTP client for API calls |

---

## Project Structure

```
failure prediction/
│
├── backend/                        # FastAPI Backend
│   ├── requirements.txt            # Python dependencies
│   └── robot_app/
│       ├── main.py                 # FastAPI application entry point
│       ├── api/                    # REST API route handlers
│       │   ├── health.py           # Health check endpoint
│       │   ├── predict.py          # Multimodal inference endpoint
│       │   ├── explain.py          # SHAP + Grad-CAM XAI endpoints
│       │   ├── safety.py           # Safety decision rule engine
│       │   ├── robustness.py       # Noise/dropout stress test endpoints
│       │   ├── models.py           # Model registry & comparison
│       │   ├── experiments.py      # Experiment log endpoints
│       │   ├── datasets.py         # Dataset management endpoints
│       │   ├── alerts.py           # Alert management endpoints
│       │   └── train.py            # Model training endpoints
│       ├── ml/
│       │   ├── predictor.py        # Core multimodal predictor
│       │   ├── demo_generator.py   # Demo data generator
│       │   ├── sensor_model/       # 1D CNN-LSTM sensor encoder
│       │   └── vision_model/       # ResNet18 vision encoder
│       ├── xai/
│       │   ├── shap_explainer.py   # SHAP Kernel explainer
│       │   └── gradcam_explainer.py# Grad-CAM heatmap generator
│       ├── safety/
│       │   └── rules.py            # ISO 10218 safety rule engine
│       ├── models/
│       │   └── db_models.py        # SQLAlchemy DB models
│       ├── schemas/                # Pydantic request/response schemas
│       └── core/
│           ├── config.py           # Settings & configuration
│           ├── database.py         # DB connection & initialization
│           └── logging_config.py   # Structured logging
│
├── frontend/                       # React + TypeScript Dashboard
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts              # Vite config with /api proxy
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx                # React 18 entry point
│       ├── App.tsx                 # Root component + live polling
│       ├── index.css               # Global styles + custom utilities
│       ├── layouts/
│       │   └── DashboardLayout.tsx # Sidebar + header layout shell
│       ├── pages/                  # 12 dashboard page modules
│       │   ├── OverviewPage.tsx
│       │   ├── SensorMonitorPage.tsx
│       │   ├── VisionInspectionPage.tsx
│       │   ├── PredictionPage.tsx
│       │   ├── ExplainabilityPage.tsx
│       │   ├── RobustnessLabPage.tsx
│       │   ├── SafetyDecisionPage.tsx
│       │   ├── ModelComparisonPage.tsx
│       │   ├── ExperimentsPage.tsx
│       │   ├── DatasetsPage.tsx
│       │   ├── TrainingPage.tsx
│       │   └── SettingsPage.tsx
│       ├── services/
│       │   └── api.ts              # Axios API client (all endpoints)
│       └── types/
│           └── index.ts            # TypeScript interface definitions
│
├── ml/                             # Standalone ML pipeline modules
│   ├── fusion/
│   │   ├── attention_fusion.py     # Cross-attention fusion model
│   │   └── concat_fusion.py        # Concatenation fusion baseline
│   ├── preprocessing/
│   │   ├── sensor_preprocessing.py # Sensor signal preprocessing
│   │   └── vision_preprocessing.py # Image preprocessing pipeline
│   ├── robustness/
│   │   ├── noise.py                # Gaussian noise injection
│   │   └── dropout.py              # Sensor channel dropout
│   ├── safety/
│   │   └── rules.py                # ML-layer safety rule evaluation
│   ├── sensor_model/
│   │   └── model.py                # 1D CNN + BiLSTM sensor encoder
│   └── vision_model/
│       └── model.py                # ResNet18 defect classifier
│
├── experiments/                    # Research experiment scripts
│   ├── run_baselines.py            # Exp A & B: Sensor/Vision-only baselines
│   ├── run_fusion.py               # Exp C & D: Fusion comparison
│   ├── run_robustness.py           # Exp G-J: Robustness stress tests
│   ├── run_xai.py                  # Exp F: XAI audit generation
│   └── run_full_evaluation.py      # Full benchmark pipeline
│
├── config/
│   └── config.yaml                 # System configuration
│
├── results/                        # Pre-computed experiment results
│   ├── metrics/
│   │   ├── baselines.json
│   │   ├── fusion_comparison.json
│   │   └── full_evaluation_summary.json
│   ├── robustness/
│   │   └── robustness_results.json
│   └── explanations/
│       └── xai_audit.json
│
├── tests/                          # Test suite (16 tests)
│   ├── backend/
│   │   ├── test_api.py             # API endpoint integration tests
│   │   └── test_safety.py          # Safety rule unit tests
│   └── ml/
│       └── test_models.py          # ML model unit tests
│
└── run.py                          # One-command startup script
```

---

## Features

### 🧠 AI & Machine Learning
- **Multimodal Failure Classification** — 6 failure classes: `Bearing Failure`, `Mechanical Wear`, `Overheating`, `Misalignment`, `Motor Failure`, `Normal`
- **Cross-Attention Fusion** — dynamically weights sensor vs. vision features per input
- **Robustness Testing** — degradation curves under Gaussian noise (0-50%) and sensor dropout (0-50%)
- **Missing Modality Fallback** — zero-imputation with confidence penalty when camera or sensor drops offline

### 🔍 Explainability (XAI)
- **SHAP (Kernel Explainer)** — per-feature contribution scores for vibration, current, temperature
- **Grad-CAM** — spatial activation heatmaps overlaid on camera inspection frames
- **Audit Trail** — natural language reasoning summaries for every prediction

### 🛡️ Safety
- **Deterministic Rule Engine** — ISO 10218 / IEC 61508 aligned rules
- **Actions**: `CONTINUE OPERATION`, `SCHEDULE MAINTENANCE`, `REDUCE SPEED 50%`, `IMMEDIATE HALT`
- **Operator Override** — manual E-Stop, derate, and reset controls with audit logging

### 📊 Dashboard (12 Modules)
1. **Overview** — Live telemetry KPIs, alerts, and quick prediction
2. **Sensor Monitor** — Real-time vibration/current/temperature time-series charts
3. **Vision Inspection** — Camera frame + Grad-CAM overlay viewer
4. **AI Prediction** — Interactive inference with parameter sliders
5. **Explainability** — SHAP bars + Grad-CAM heatmaps
6. **Robustness Lab** — Stress test execution and degradation curves
7. **Safety Decision** — Rule evaluation tree + operator overrides
8. **Model Comparison** — Benchmark matrix across all 5 architectures
9. **Experiments** — Scientific experiment ledger (Exp A–J)
10. **Datasets** — Dataset catalog + upload + schema inspector
11. **Training** — Hyperparameter studio + live loss/accuracy curves
12. **Settings** — Safety thresholds, robot binding, system diagnostics

---

## Quick Start

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** and **npm 9+**
- Git

### One-Command Start

```bash
python run.py
```

This starts both the backend (port 8000) and opens the frontend dev server (port 5173).

---

## Backend Setup

### 1. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the FastAPI server

```bash
# From the project root
cd backend
uvicorn robot_app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Verify the API is running

Open [http://localhost:8000](http://localhost:8000) — you should see:
```json
{
  "app": "Industrial Robot AI Safety Console",
  "version": "1.0.0",
  "status": "ONLINE",
  "docs_url": "/docs"
}
```

### 4. API Documentation (Swagger UI)

[http://localhost:8000/docs](http://localhost:8000/docs)

---

## Frontend Setup

### 1. Install Node dependencies

```bash
cd frontend
npm install
```

### 2. Start the Vite dev server

```bash
npm run dev
```

The dashboard will open at [http://localhost:5173](http://localhost:5173).

> The Vite dev server proxies all `/api/*` requests to `http://localhost:8000` automatically (configured in `vite.config.ts`).

### 3. Production Build

```bash
npm run build
```

Build output goes to `frontend/dist/` — this can be served by any static host or the FastAPI `StaticFiles` mount.

---

## Running Experiments

All experiment scripts are in `experiments/`. Run from the project root:

```bash
# Exp A & B: Sensor-only and Vision-only baselines
python experiments/run_baselines.py

# Exp C & D: Concatenation vs. Cross-Attention fusion comparison
python experiments/run_fusion.py

# Exp G-J: Robustness stress tests (noise, dropout, missing modalities)
python experiments/run_robustness.py

# Exp F: XAI explanation audit generation
python experiments/run_xai.py

# Full benchmark pipeline (all experiments)
python experiments/run_full_evaluation.py
```

Results are saved to `results/metrics/`, `results/robustness/`, and `results/explanations/`.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | System health check & uptime |
| `POST` | `/api/predict` | Run multimodal failure prediction |
| `GET` | `/api/predict/live` | Live stream telemetry (polling) |
| `POST` | `/api/explain/shap` | SHAP feature attributions |
| `POST` | `/api/explain/gradcam` | Grad-CAM visual heatmap |
| `POST` | `/api/robustness/test` | Run noise/dropout stress tests |
| `POST` | `/api/safety/decision` | Evaluate safety decision rules |
| `GET` | `/api/safety/rules` | List configured safety rules |
| `GET` | `/api/models` | Model registry list |
| `GET` | `/api/models/comparison` | Benchmark comparison data |
| `GET` | `/api/experiments` | Experiment log (Exp A–J) |
| `GET` | `/api/datasets` | Dataset catalog |
| `POST` | `/api/datasets/upload` | Upload custom telemetry file |
| `POST` | `/api/train` | Start a training run |
| `GET` | `/api/train/status` | Get training status & history |
| `GET` | `/api/alerts` | Active safety alerts |
| `POST` | `/api/alerts/{id}/acknowledge` | Acknowledge an alert |

---

## Dashboard Modules

### AI Prediction Page
- Set vibration, current, temperature, Gaussian noise %, and sensor dropout % via sliders
- Choose fusion architecture: **Cross-Attention** (proposed) or **Concatenation** (baseline)
- Pre-defined fault injection presets (Normal, Bearing Failure, Overheating, Misalignment)
- Returns: failure class, confidence %, severity, affected component, recommended action

### Explainability Page
- **SHAP chart**: horizontal bar chart showing each sensor feature's positive/negative contribution
- **Grad-CAM overlay**: original camera frame + thermal heatmap showing fault localization
- **Cross-Attention weights**: real-time bar showing how much weight sensor vs. vision got

### Robustness Lab
- Run `/api/robustness/test` with configurable noise sweep levels
- View degradation curves (Accuracy, F1-Score, Confidence) as noise/dropout increases
- Missing modality fallback comparison table

### Safety Decision Page
- Configure test scenario (failure class, severity, confidence, missing modalities)
- Evaluate all 5 safety rules in real-time
- View which rules triggered, what action was selected, and the full audit reason
- Operator override buttons: **Emergency E-Stop**, **50% Speed Derate**, **Reset to Nominal**

---

## Testing

### Run all tests

```bash
python -m pytest
```

### Expected output

```
============================= test session info =============================
platform win32 -- Python 3.12.10, pytest-9.1.1
collected 16 items

tests/backend/test_api.py .......                                    [ 43%]
tests/backend/test_safety.py .....                                   [ 75%]
tests/ml/test_models.py ....                                         [100%]

======================= 16 passed in ~12s ==========================
```

### Test coverage
| Test File | Tests | What is Covered |
|---|---|---|
| `test_api.py` | 7 | Health, prediction, SHAP, Grad-CAM, robustness, safety, alerts |
| `test_safety.py` | 5 | All 5 deterministic safety rules with edge cases |
| `test_models.py` | 4 | Sensor model, vision model, attention fusion, concat fusion |

---

## Research Experiments

| Exp | Name | Architecture | Key Metric |
|-----|------|-------------|-----------|
| **A** | Sensor-Only Baseline | 1D CNN + BiLSTM | 86.2% Accuracy |
| **B** | Vision-Only Baseline | ResNet18 Fine-Tuned | 79.4% Accuracy |
| **C** | Concatenation Fusion | CNN-LSTM + ResNet18 + Dense | 91.5% Accuracy |
| **D** | Cross-Attention Fusion ⭐ | CNN-LSTM + ResNet18 + CrossAttn | **94.8% Accuracy** |
| **E** | Fusion without XAI | Cross-Attention (black-box) | 94.8% Accuracy |
| **F** | Fusion + XAI | Cross-Attention + SHAP + Grad-CAM | 94.8% + Interpretable |
| **G** | Noise Robustness | Cross-Attention | 88.5% @ 20% noise |
| **H** | Dropout Robustness | Cross-Attention | 89.2% @ 20% dropout |
| **I** | Missing Sensor | Vision-only fallback | 79.4% Accuracy |
| **J** | Missing Vision | Sensor-only fallback | 86.2% Accuracy |

---

## Results

| Model | Accuracy | F1-Score | AUC-ROC | Latency | Params |
|-------|----------|----------|---------|---------|--------|
| Sensor-Only (CNN-LSTM) | 86.2% | 0.856 | 0.921 | 7.1ms | 8.4M |
| Vision-Only (ResNet18) | 79.4% | 0.787 | 0.868 | 18.5ms | 11.2M |
| Non-Explainable Multimodal | 93.1% | 0.927 | 0.975 | 12.8ms | 16.1M |
| Concat Fusion + XAI | 91.5% | 0.910 | 0.962 | 11.5ms | 12.8M |
| **Cross-Attention + XAI ⭐** | **94.8%** | **0.944** | **0.985** | **14.2ms** | **14.2M** |

---

## Disclaimer

> **Research Prototype Only.** Predictions, safety recommendations, and all outputs from this system are for **research and decision support purposes only**. This system has **not been validated** for deployment in real safety-critical industrial environments. Real-world deployment requires thorough validation, safety certification (ISO 10218, IEC 61508, etc.), and compliance with applicable industrial safety standards. The authors accept no liability for any use of this system in production environments.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

**Ravi** — [ravicodeslab](https://github.com/ravicodeslab)
