"""
Noise Injection for Robustness Testing.
Injects Gaussian noise into sensor signals at specified noise variance or SNR levels.
"""
from __future__ import annotations

import numpy as np
import torch


def add_gaussian_noise_numpy(
    signal: np.ndarray,
    noise_level: float = 0.1,
    seed: int | None = None,
) -> np.ndarray:
    """
    signal: (N, C) or (C, N)
    noise_level: scale relative to standard deviation of signal
    """
    if noise_level <= 0.0:
        return signal.copy()
    if seed is not None:
        np.random.seed(seed)

    std = np.std(signal, axis=0, keepdims=True)
    std = np.where(std < 1e-6, 1.0, std)
    noise = np.random.randn(*signal.shape) * (noise_level * std)
    return signal + noise


def add_gaussian_noise_tensor(
    tensor: torch.Tensor,
    noise_level: float = 0.1,
) -> torch.Tensor:
    """
    Inject Gaussian noise directly on PyTorch tensors.
    tensor: (B, L, C) or (B, C, L)
    """
    if noise_level <= 0.0:
        return tensor.clone()

    std = torch.std(tensor, dim=1, keepdim=True)
    std = torch.where(std < 1e-6, torch.ones_like(std), std)
    noise = torch.randn_like(tensor) * (noise_level * std)
    return tensor + noise
