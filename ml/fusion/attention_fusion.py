"""
Cross-Attention Multimodal Fusion:
Applies bidirectional multi-head cross-attention between sensor embeddings
and vision embeddings.
Sensor features query visual representations (S->V) and visual features query
sensor representations (V->S), followed by gated aggregation and classification.
"""
from __future__ import annotations

from typing import Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

from ml.sensor_model.model import Sensor1DCNNLSTM
from ml.vision_model.model import VisionResNet18


class CrossAttentionBlock(nn.Module):
    def __init__(self, embed_dim: int, num_heads: int = 4, dropout: float = 0.1):
        super().__init__()
        self.attn = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout, batch_first=True)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.ffn = nn.Sequential(
            nn.Linear(embed_dim, embed_dim * 2),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(embed_dim * 2, embed_dim),
        )
        self.dropout = nn.Dropout(dropout)

    def forward(self, query: torch.Tensor, key_value: torch.Tensor) -> torch.Tensor:
        # query, key_value shapes: (B, 1, embed_dim)
        attn_out, _ = self.attn(query, key_value, key_value)
        x = self.norm1(query + self.dropout(attn_out))
        ffn_out = self.ffn(x)
        out = self.norm2(x + self.dropout(ffn_out))
        return out


class CrossAttentionFusionModel(nn.Module):
    def __init__(
        self,
        sensor_model: Optional[Sensor1DCNNLSTM] = None,
        vision_model: Optional[VisionResNet18] = None,
        embedding_dim: int = 256,
        num_heads: int = 4,
        num_classes: int = 8,
        dropout: float = 0.3,
    ):
        super().__init__()
        self.sensor_branch = sensor_model or Sensor1DCNNLSTM(embedding_dim=embedding_dim, num_classes=num_classes)
        self.vision_branch = vision_model or VisionResNet18(embedding_dim=embedding_dim, num_classes=num_classes)

        self.embedding_dim = embedding_dim
        self.num_classes = num_classes

        # Bidirectional cross-attention modules
        self.sensor_to_vision_attn = CrossAttentionBlock(embedding_dim, num_heads=num_heads, dropout=dropout * 0.5)
        self.vision_to_sensor_attn = CrossAttentionBlock(embedding_dim, num_heads=num_heads, dropout=dropout * 0.5)

        # Gated fusion module to dynamically weight modal interactions
        self.gate = nn.Sequential(
            nn.Linear(embedding_dim * 2, 2),
            nn.Softmax(dim=-1),
        )

        # Final prediction head
        self.classifier = nn.Sequential(
            nn.Linear(embedding_dim, 256),
            nn.LayerNorm(256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(256, num_classes),
        )

        # Learnable surrogate tokens for missing modalities
        self.empty_sensor_embed = nn.Parameter(torch.zeros(1, embedding_dim))
        self.empty_vision_embed = nn.Parameter(torch.zeros(1, embedding_dim))

    def forward(
        self,
        sensor_x: Optional[torch.Tensor] = None,
        vision_x: Optional[torch.Tensor] = None,
    ) -> Tuple[torch.Tensor, str]:
        batch_size = 1
        if sensor_x is not None:
            batch_size = sensor_x.shape[0]
        elif vision_x is not None:
            batch_size = vision_x.shape[0]

        # 1. Feature extraction
        if sensor_x is not None:
            s_feat = self.sensor_branch.extract_features(sensor_x)
        else:
            s_feat = self.empty_sensor_embed.expand(batch_size, -1)

        if vision_x is not None:
            v_feat = self.vision_branch.extract_features(vision_x)
        else:
            v_feat = self.empty_vision_embed.expand(batch_size, -1)

        # Reshape to sequence of length 1 for MHA: (B, 1, embed_dim)
        s_seq = s_feat.unsqueeze(1)
        v_seq = v_feat.unsqueeze(1)

        # Missing modality routing
        if sensor_x is not None and vision_x is not None:
            modality_status = "multimodal"
            # Cross-attention interactions
            s_attended = self.sensor_to_vision_attn(s_seq, v_seq).squeeze(1)  # Sensor queried by Vision
            v_attended = self.vision_to_sensor_attn(v_seq, s_seq).squeeze(1)  # Vision queried by Sensor

            # Dynamic gate weights
            gate_weights = self.gate(torch.cat([s_feat, v_feat], dim=-1))  # (B, 2)
            fused_feat = (
                gate_weights[:, 0:1] * s_attended + gate_weights[:, 1:2] * v_attended
            )
        elif sensor_x is not None:
            modality_status = "sensor_only"
            fused_feat = s_feat
        elif vision_x is not None:
            modality_status = "vision_only"
            fused_feat = v_feat
        else:
            raise ValueError("At least one modality must be present.")

        # Logits
        logits = self.classifier(fused_feat)
        return logits, modality_status
