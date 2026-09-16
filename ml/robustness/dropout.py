"""
Sensor Dropout Simulation for Robustness Testing.
Simulates missing readings, packet loss, or malfunctioning sensor channels.
Supports: 10%, 20%, 30%, 40%, 50% temporal or channel dropout.
"""
from __future__ import annotations

import numpy as np
import torch


def apply_sensor_dropout_numpy(
    signal: np.ndarray,
    dropout_rate: float = 0.2,
    mode: str = "zero",  # "zero", "last_value", or "channel_drop"
    seed: int | None = None,
) -> np.ndarray:
    """
    signal: (N, C)
    dropout_rate: 0.0 to 0.5
    """
    if dropout_rate <= 0.0:
        return signal.copy()
    if seed is not None:
        np.random.seed(seed)

    result = signal.copy()
    num_steps, num_channels = signal.shape

    if mode == "channel_drop":
        # Randomly completely drop one or more channels
        for c in range(num_channels):
            if np.random.rand() < dropout_rate:
                result[:, c] = 0.0
    else:
        # Temporal packet dropout mask
        mask = np.random.rand(num_steps, 1) >= dropout_rate
        if mode == "zero":
            result = result * mask
        elif mode == "last_value":
            # Sample and hold
            for i in range(1, num_steps):
                if not mask[i, 0]:
                    result[i] = result[i - 1]

    return result


def apply_sensor_dropout_tensor(
    tensor: torch.Tensor,
    dropout_rate: float = 0.2,
) -> torch.Tensor:
    """
    tensor: (B, L, C)
    """
    if dropout_rate <= 0.0:
        return tensor.clone()

    mask = (torch.rand(tensor.shape[0], tensor.shape[1], 1, device=tensor.device) >= dropout_rate).float()
    return tensor * mask
