"""
Concatenation Multimodal Fusion:
Concatenates the sensor embedding and vision embedding, then passes
through fully connected layers with LayerNorm/Dropout to the prediction head.
Gracefully handles missing modality by masking or dynamic bypass.
"""
from __future__ import annotations

from typing import Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

from ml.sensor_model.model import Sensor1DCNNLSTM
from ml.vision_model.model import VisionResNet18


class ConcatFusionModel(nn.Module):
    def __init__(
        self,
        sensor_model: Optional[Sensor1DCNNLSTM] = None,
        vision_model: Optional[VisionResNet18] = None,
        embedding_dim: int = 256,
        hidden_dim: int = 512,
        num_classes: int = 8,
        dropout: float = 0.3,
    ):
        super().__init__()
        self.sensor_branch = sensor_model or Sensor1DCNNLSTM(embedding_dim=embedding_dim, num_classes=num_classes)
        self.vision_branch = vision_model or VisionResNet18(embedding_dim=embedding_dim, num_classes=num_classes)
        
        self.embedding_dim = embedding_dim
        self.num_classes = num_classes

        # Joint fusion network: concatenated dimension is embedding_dim * 2
        self.fusion_fc = nn.Sequential(
            nn.Linear(embedding_dim * 2, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.LayerNorm(hidden_dim // 2),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout * 0.5),
        )

        self.classifier = nn.Linear(hidden_dim // 2, num_classes)

        # Fallback learned surrogate tokens for missing modalities
        self.empty_sensor_embed = nn.Parameter(torch.zeros(1, embedding_dim))
        self.empty_vision_embed = nn.Parameter(torch.zeros(1, embedding_dim))

    def forward(
        self,
        sensor_x: Optional[torch.Tensor] = None,
        vision_x: Optional[torch.Tensor] = None,
    ) -> Tuple[torch.Tensor, str]:
        """
        Forward pass with robust missing modality handling.
        Returns: (logits, modality_used_status)
        """
        batch_size = 1
        if sensor_x is not None:
            batch_size = sensor_x.shape[0]
        elif vision_x is not None:
            batch_size = vision_x.shape[0]

        # 1. Sensor branch
        if sensor_x is not None:
            sensor_feat = self.sensor_branch.extract_features(sensor_x)
        else:
            sensor_feat = self.empty_sensor_embed.expand(batch_size, -1)

        # 2. Vision branch
        if vision_x is not None:
            vision_feat = self.vision_branch.extract_features(vision_x)
        else:
            vision_feat = self.empty_vision_embed.expand(batch_size, -1)

        # Determine active modality status
        if sensor_x is not None and vision_x is not None:
            modality_status = "multimodal"
        elif sensor_x is not None:
            modality_status = "sensor_only"
        elif vision_x is not None:
            modality_status = "vision_only"
        else:
            raise ValueError("At least one modality (sensor or vision) must be provided.")

        # 3. Concatenate
        fused = torch.cat([sensor_feat, vision_feat], dim=1)  # (B, embedding_dim * 2)

        # 4. Dense fusion and classification
        hidden = self.fusion_fc(fused)
        logits = self.classifier(hidden)

        return logits, modality_status
