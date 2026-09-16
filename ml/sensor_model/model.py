"""
Sensor Feature Extractor and Classifier: 1D CNN + LSTM.
- 1D CNN extracts localized temporal and harmonic patterns.
- LSTM learns longer temporal dependencies across the segmented window.
Configurable to also support CNN-only, LSTM-only, or GRU.
"""
from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F


class Sensor1DCNNLSTM(nn.Module):
    """
    Combines 1D Temporal Convolutions with a Bidirectional/Unidirectional LSTM
    to produce a dense sensor embedding or direct classification logits.
    """
    def __init__(
        self,
        input_channels: int = 3,  # [vibration, current, temperature]
        window_size: int = 128,
        cnn_channels: List[int] = [32, 64, 128],
        lstm_hidden: int = 128,
        lstm_layers: int = 2,
        embedding_dim: int = 256,
        num_classes: int = 8,
        dropout: float = 0.3,
        bidirectional: bool = True,
    ):
        super().__init__()
        self.input_channels = input_channels
        self.window_size = window_size
        self.embedding_dim = embedding_dim
        self.num_classes = num_classes

        # 1D CNN layers for local feature extraction (temporal receptive fields)
        conv_layers = []
        in_c = input_channels
        for out_c in cnn_channels:
            conv_layers.extend([
                nn.Conv1d(in_c, out_c, kernel_size=5, stride=1, padding=2),
                nn.BatchNorm1d(out_c),
                nn.ReLU(inplace=True),
                nn.MaxPool1d(kernel_size=2, stride=2),
                nn.Dropout(dropout * 0.5),
            ])
            in_c = out_c
        self.cnn = nn.Sequential(*conv_layers)

        # Calculate time steps after max-pooling (divided by 2^len(cnn_channels))
        pooled_len = window_size // (2 ** len(cnn_channels))
        if pooled_len < 1:
            pooled_len = 1

        # LSTM for sequential dependencies
        self.lstm = nn.LSTM(
            input_size=cnn_channels[-1],
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            bidirectional=bidirectional,
            dropout=dropout if lstm_layers > 1 else 0.0,
        )

        lstm_out_dim = lstm_hidden * (2 if bidirectional else 1)

        # Projection to standard embedding dimension
        self.fc_embed = nn.Sequential(
            nn.Linear(lstm_out_dim, embedding_dim),
            nn.BatchNorm1d(embedding_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
        )

        # Classification head (used for sensor-only baseline)
        self.classifier = nn.Linear(embedding_dim, num_classes)

    def extract_features(self, x: torch.Tensor) -> torch.Tensor:
        """
        Input x: (batch_size, window_size, input_channels) or (batch_size, input_channels, window_size)
        Returns: (batch_size, embedding_dim)
        """
        # Ensure shape is (B, C, L) for Conv1d
        if x.dim() == 3 and x.shape[1] == self.window_size and x.shape[2] == self.input_channels:
            x = x.permute(0, 2, 1)

        # 1. 1D CNN
        conv_out = self.cnn(x)  # (B, cnn_channels[-1], pooled_len)

        # 2. Permute to (B, pooled_len, cnn_channels[-1]) for LSTM
        lstm_in = conv_out.permute(0, 2, 1)
        lstm_out, (hn, cn) = self.lstm(lstm_in)

        # Take last time step or average pooling over sequence
        feat = torch.mean(lstm_out, dim=1)

        # 3. Dense embedding projection
        embedding = self.fc_embed(feat)
        return embedding

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Full forward pass returning classification logits.
        """
        embedding = self.extract_features(x)
        logits = self.classifier(embedding)
        return logits
