"""
Vision Feature Extractor and Classifier: ResNet18 Backbone.
Extracts spatial representations of surface defects (cracks, pitting, wear, burn marks).
Exposes layer4 activation maps for Grad-CAM explainability.
"""
from __future__ import annotations

from typing import Optional

import torch
import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights


class VisionResNet18(nn.Module):
    def __init__(
        self,
        pretrained: bool = True,
        embedding_dim: int = 256,
        num_classes: int = 8,
        dropout: float = 0.3,
    ):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.num_classes = num_classes

        # Load standard ResNet18 backbone
        try:
            weights = ResNet18_Weights.DEFAULT if pretrained else None
            backbone = resnet18(weights=weights)
        except Exception:
            # Fallback if offline / weights download unavailable
            backbone = resnet18(weights=None)

        self.conv1 = backbone.conv1
        self.bn1 = backbone.bn1
        self.relu = backbone.relu
        self.maxpool = backbone.maxpool

        self.layer1 = backbone.layer1
        self.layer2 = backbone.layer2
        self.layer3 = backbone.layer3
        self.layer4 = backbone.layer4

        self.avgpool = backbone.avgpool
        
        # Linear projection to matching multimodal embedding dim
        self.fc_embed = nn.Sequential(
            nn.Linear(512, embedding_dim),
            nn.BatchNorm1d(embedding_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
        )

        # Classifier head for vision-only baseline
        self.classifier = nn.Linear(embedding_dim, num_classes)

    def extract_feature_maps(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass up to layer4 for Grad-CAM hooks."""
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        return x

    def extract_features(self, x: torch.Tensor) -> torch.Tensor:
        """Returns dense embedding (batch_size, embedding_dim)."""
        feat_map = self.extract_feature_maps(x)
        pooled = self.avgpool(feat_map)
        flat = torch.flatten(pooled, 1)
        embedding = self.fc_embed(flat)
        return embedding

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Returns classification logits."""
        embedding = self.extract_features(x)
        logits = self.classifier(embedding)
        return logits
