"""
Sensor Data Preprocessing Pipeline:
- Loads CSV / Parquet time-series datasets
- Column validation and schema mapping
- Missing value imputation (linear interpolation / forward fill)
- Feature normalization (StandardScaler / MinMax)
- Time-series sliding window segmentation
- Conversion to PyTorch model-ready tensors
"""
from __future__ import annotations

from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
import torch


class SensorPreprocessor:
    def __init__(
        self,
        column_mapping: Optional[Dict[str, str]] = None,
        window_size: int = 128,
        window_stride: int = 64,
        features: Optional[List[str]] = None,
    ):
        self.column_mapping = column_mapping or {
            "timestamp": "timestamp",
            "vibration": "vibration",
            "current": "current",
            "temperature": "temperature",
            "label": "label",
        }
        self.window_size = window_size
        self.window_stride = window_stride
        self.features = features or ["vibration", "current", "temperature"]
        
        # Scaling statistics
        self.means: Dict[str, float] = {}
        self.stds: Dict[str, float] = {}
        self.is_fitted = False

    def fit(self, df: pd.DataFrame) -> "SensorPreprocessor":
        """Compute normalization statistics on training data."""
        df_mapped = self._apply_mapping(df)
        for feat in self.features:
            if feat in df_mapped.columns:
                self.means[feat] = float(df_mapped[feat].mean())
                self.stds[feat] = float(df_mapped[feat].std()) if df_mapped[feat].std() > 1e-6 else 1.0
            else:
                self.means[feat] = 0.0
                self.stds[feat] = 1.0
        self.is_fitted = True
        return self

    def _apply_mapping(self, df: pd.DataFrame) -> pd.DataFrame:
        """Map raw columns to standardized names."""
        inv_map = {v: k for k, v in self.column_mapping.items()}
        renamed = df.rename(columns=inv_map)
        return renamed

    def clean_and_impute(self, df: pd.DataFrame) -> pd.DataFrame:
        """Interpolate NaNs and forward/backward fill remaining missing values."""
        df = df.copy()
        for col in self.features:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
                df[col] = df[col].interpolate(method="linear").bfill().ffill()
            else:
                # If a required column is missing, initialize with zeros
                df[col] = 0.0
        return df

    def transform(self, df: pd.DataFrame) -> Tuple[torch.Tensor, Optional[np.ndarray]]:
        """
        Normalize features and apply sliding window segmentation.
        Returns:
            windows_tensor: torch.Tensor of shape (N, window_size, len(features))
            labels: np.ndarray of shape (N,) if 'label' column is present, else None
        """
        df_mapped = self._apply_mapping(df)
        df_clean = self.clean_and_impute(df_mapped)

        # Normalize features
        norm_matrix = np.zeros((len(df_clean), len(self.features)), dtype=np.float32)
        for i, feat in enumerate(self.features):
            vals = df_clean[feat].values
            mean = self.means.get(feat, 0.0)
            std = self.stds.get(feat, 1.0)
            norm_matrix[:, i] = (vals - mean) / std

        # Sliding window segmentation
        total_steps = len(df_clean)
        windows = []
        labels_list = []
        has_labels = "label" in df_clean.columns

        for start in range(0, total_steps - self.window_size + 1, self.window_stride):
            end = start + self.window_size
            win = norm_matrix[start:end, :]
            windows.append(win)

            if has_labels:
                # Most frequent label in the window
                win_label = df_clean["label"].iloc[start:end].mode()[0]
                labels_list.append(win_label)

        if not windows:
            # If total data length is smaller than window_size, pad to window_size
            pad_len = self.window_size - total_steps
            padded = np.pad(norm_matrix, ((0, pad_len), (0, 0)), mode="edge")
            windows.append(padded)
            if has_labels:
                labels_list.append(df_clean["label"].iloc[-1])

        windows_array = np.array(windows, dtype=np.float32)
        windows_tensor = torch.from_numpy(windows_array)

        labels_array = np.array(labels_list) if has_labels else None
        return windows_tensor, labels_array

    def fit_transform(self, df: pd.DataFrame) -> Tuple[torch.Tensor, Optional[np.ndarray]]:
        return self.fit(df).transform(df)
