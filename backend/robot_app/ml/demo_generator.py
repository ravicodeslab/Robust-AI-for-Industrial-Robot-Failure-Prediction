"""
Demo Data Generator for Industrial Robot AI Console.
Generates realistic physical sensor signals and synthetic inspection images
with simulated industrial defects (bearing spalls, surface wear, overheating burns, cracks).
All outputs are clearly tagged with: "DEMONSTRATION DATA".
"""
from __future__ import annotations

import base64
import io
import math
import random
from typing import Any, Dict, List, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from robot_app.core.config import get_failure_classes


def generate_synthetic_sensor_window(
    failure_class: str = "Normal",
    window_size: int = 128,
    noise_level: float = 0.0,
    dropout_rate: float = 0.0,
    seed: int | None = None,
) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Generate a 2D numpy array of shape (window_size, 3) representing [vibration, current, temperature].
    Returns: (sensor_array, computed_features_dict)
    """
    if seed is not None:
        np.random.seed(seed)
        random.seed(seed)

    t = np.linspace(0, 2.0, window_size)  # 2 seconds window

    # Base operating parameters
    base_rpm_hz = 30.0  # 1800 RPM = 30 Hz shaft frequency
    
    if failure_class == "Normal":
        vib = 0.12 * np.sin(2 * np.pi * base_rpm_hz * t) + 0.04 * np.random.randn(window_size)
        curr = 2.2 + 0.15 * np.sin(2 * np.pi * 50 * t) + 0.05 * np.random.randn(window_size)
        temp = 42.0 + 0.5 * np.sin(0.1 * t) + 0.2 * np.random.randn(window_size)

    elif failure_class == "Bearing Failure":
        # Bearing outer race defect BPFO ~ 3.5 * shaft frequency + periodic shock pulses
        bpfo = 3.58 * base_rpm_hz
        shocks = np.zeros(window_size)
        shock_indices = np.arange(0, window_size, int(window_size / 8))
        shocks[shock_indices] = 0.85
        vib = (
            0.65 * np.sin(2 * np.pi * bpfo * t)
            + shocks
            + 0.18 * np.random.randn(window_size)
        )
        curr = 2.8 + 0.35 * np.sin(2 * np.pi * 50 * t) + 0.12 * np.random.randn(window_size)
        temp = 54.0 + 1.2 * t + 0.4 * np.random.randn(window_size)

    elif failure_class == "Motor Failure":
        # Stator/rotor asymmetry causing high current ripple and magnetic unbalance vibration
        vib = 0.45 * np.sin(2 * np.pi * 2 * base_rpm_hz * t) + 0.15 * np.random.randn(window_size)
        curr = 4.8 + 1.2 * np.sin(2 * np.pi * 100 * t) + 0.25 * np.random.randn(window_size)
        temp = 68.0 + 2.5 * t + 0.6 * np.random.randn(window_size)

    elif failure_class == "Sensor Fault":
        # Intermittent clipping, sensor drift, or random spikes
        vib = 0.2 * np.sin(2 * np.pi * base_rpm_hz * t) + 0.05 * np.random.randn(window_size)
        # Random spike/drop
        vib[random.randint(10, window_size - 10)] = 2.5
        curr = 2.3 + 0.1 * np.random.randn(window_size)
        temp = 43.0 + 0.2 * np.random.randn(window_size)

    elif failure_class == "Overheating":
        vib = 0.25 * np.sin(2 * np.pi * base_rpm_hz * t) + 0.08 * np.random.randn(window_size)
        curr = 3.8 + 0.4 * np.random.randn(window_size)
        temp = 82.0 + 4.0 * t + 0.8 * np.random.randn(window_size)  # High thermal escalation

    elif failure_class == "Mechanical Wear":
        # High broadband friction noise, harmonic distortion
        vib = (
            0.35 * np.sin(2 * np.pi * base_rpm_hz * t)
            + 0.25 * np.sin(2 * np.pi * 3 * base_rpm_hz * t)
            + 0.22 * np.random.randn(window_size)
        )
        curr = 3.1 + 0.2 * np.sin(2 * np.pi * 50 * t) + 0.15 * np.random.randn(window_size)
        temp = 58.0 + 1.1 * t + 0.3 * np.random.randn(window_size)

    elif failure_class == "Misalignment":
        # Dominant 2X shaft frequency vibration
        vib = (
            0.3 * np.sin(2 * np.pi * base_rpm_hz * t)
            + 0.7 * np.sin(2 * np.pi * 2 * base_rpm_hz * t)
            + 0.1 * np.random.randn(window_size)
        )
        curr = 3.4 + 0.4 * np.sin(2 * np.pi * 50 * t) + 0.1 * np.random.randn(window_size)
        temp = 52.0 + 0.8 * t + 0.3 * np.random.randn(window_size)

    else:  # Other Failure
        vib = 0.4 * np.sin(2 * np.pi * base_rpm_hz * t) + 0.2 * np.random.randn(window_size)
        curr = 3.0 + 0.3 * np.random.randn(window_size)
        temp = 50.0 + 1.0 * t + 0.3 * np.random.randn(window_size)

    # Inject Gaussian Noise if requested
    if noise_level > 0.0:
        vib += noise_level * np.random.randn(window_size)
        curr += (noise_level * 1.5) * np.random.randn(window_size)
        temp += (noise_level * 5.0) * np.random.randn(window_size)

    # Inject Sensor Dropout if requested
    if dropout_rate > 0.0:
        mask = np.random.rand(window_size) > dropout_rate
        vib = np.where(mask, vib, 0.0)
        curr = np.where(mask, curr, 0.0)
        temp = np.where(mask, temp, 0.0)

    # Stack to (window_size, 3)
    sensor_matrix = np.column_stack([vib, curr, temp])

    # Compute descriptive feature indicators for SHAP / explainability
    features = {
        "vibration_rms": float(np.sqrt(np.mean(vib ** 2))),
        "vibration_kurtosis": float(
            (np.mean((vib - np.mean(vib)) ** 4) / (np.var(vib) ** 2 + 1e-6))
        ),
        "vibration_peak": float(np.max(np.abs(vib))),
        "current_mean": float(np.mean(curr)),
        "current_std": float(np.std(curr)),
        "temperature_mean": float(np.mean(temp)),
        "temperature_max": float(np.max(temp)),
        "temperature_gradient": float(temp[-1] - temp[0]),
    }

    return sensor_matrix, features


def generate_synthetic_inspection_image(
    failure_class: str = "Normal",
    size: Tuple[int, int] = (224, 224),
    seed: int | None = None,
) -> Image.Image:
    """
    Generates a realistic industrial metallic inspection image (224x224 RGB)
    with defect patterns corresponding to the failure class.
    """
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)

    w, h = size
    # Metallic textured background
    base_color = random.randint(120, 150)
    bg_array = np.full((h, w, 3), base_color, dtype=np.uint8)
    # Add subtle brushed metal texture & grain
    noise = np.random.randint(-15, 16, (h, w, 3), dtype=np.int16)
    bg_array = np.clip(bg_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    img = Image.fromarray(bg_array)
    draw = ImageDraw.Draw(img)

    # Draw circular bearing raceway / shaft contour
    cx, cy = w // 2, h // 2
    r_outer = min(w, h) // 2 - 15
    r_inner = r_outer - 35
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], outline=(90, 95, 105), width=3)
    draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], outline=(80, 85, 95), width=2)

    # Add specific visual defects based on failure class
    if failure_class == "Bearing Failure":
        # Pitting / spall flaking on raceway (concentrated dark gouges)
        defect_x = cx + int(r_inner * 0.7)
        defect_y = cy - int(r_inner * 0.3)
        for _ in range(18):
            dx = defect_x + random.randint(-14, 14)
            dy = defect_y + random.randint(-14, 14)
            rad = random.randint(2, 6)
            draw.ellipse([dx - rad, dy - rad, dx + rad, dy + rad], fill=(45, 40, 35), outline=(25, 20, 18))

    elif failure_class == "Mechanical Wear":
        # Grooved scoring lines along rotation arc
        for r_offset in range(-10, 12, 3):
            r = (r_inner + r_outer) // 2 + r_offset
            draw.arc([cx - r, cy - r, cx + r, cy + r], start=30, end=150, fill=(70, 60, 55), width=2)

    elif failure_class == "Overheating":
        # Blue-purple-amber thermal discoloration bloom
        burn = Image.new("RGBA", size, (0, 0, 0, 0))
        bdraw = ImageDraw.Draw(burn)
        bx, by = cx + 20, cy + 20
        bdraw.ellipse([bx - 45, by - 45, bx + 45, by + 45], fill=(160, 90, 40, 110))
        bdraw.ellipse([bx - 30, by - 30, bx + 30, by + 30], fill=(80, 90, 180, 140))
        bdraw.ellipse([bx - 15, by - 15, bx + 15, by + 15], fill=(40, 40, 90, 170))
        burn = burn.filter(ImageFilter.GaussianBlur(12))
        img.paste(burn, (0, 0), burn)

    elif failure_class == "Misalignment":
        # Asymmetrical contact wear wear-pattern on one side
        draw.chord([cx - r_outer + 5, cy - 30, cx - r_inner - 5, cy + 50], start=260, end=100, fill=(85, 75, 70), outline=(60, 50, 45))

    elif failure_class in ["Motor Failure", "Sensor Fault", "Other Failure"]:
        # Fine crack line
        start_x, start_y = cx - 20, cy - 30
        points = [(start_x, start_y)]
        for _ in range(6):
            start_x += random.randint(4, 10)
            start_y += random.randint(-3, 8)
            points.append((start_x, start_y))
        draw.line(points, fill=(35, 30, 30), width=2)

    # Normal has clean surface without severe defects
    return img


def image_to_base64(image: Image.Image) -> str:
    """Convert PIL image to base64 data URI string."""
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def base64_to_image(b64_string: str) -> Image.Image:
    """Convert base64 data URI string or raw base64 to PIL Image."""
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    data = base64.b64decode(b64_string)
    return Image.open(io.BytesIO(data)).convert("RGB")
