"""
Vision Preprocessing Pipeline:
- Resizes images to (224, 224)
- Normalizes using ImageNet mean and std
- Training data augmentation (flips, slight rotations, color jitter)
- Validation / inference transforms
- Conversion to model-ready torch Tensors
"""
from __future__ import annotations

import io
from typing import Optional, Tuple, Union

from PIL import Image
import torch
from torchvision import transforms


class VisionPreprocessor:
    def __init__(
        self,
        image_size: Tuple[int, int] = (224, 224),
        is_training: bool = False,
    ):
        self.image_size = image_size
        self.is_training = is_training

        # Standard ImageNet normalization parameters
        self.mean = [0.485, 0.456, 0.406]
        self.std = [0.229, 0.224, 0.225]

        if is_training:
            self.transform = transforms.Compose([
                transforms.Resize(image_size),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(degrees=15),
                transforms.ColorJitter(brightness=0.1, contrast=0.1),
                transforms.ToTensor(),
                transforms.Normalize(mean=self.mean, std=self.std),
            ])
        else:
            self.transform = transforms.Compose([
                transforms.Resize(image_size),
                transforms.ToTensor(),
                transforms.Normalize(mean=self.mean, std=self.std),
            ])

    def preprocess_pil(self, img: Image.Image) -> torch.Tensor:
        """Process a PIL Image into a (1, 3, H, W) normalized tensor."""
        if img.mode != "RGB":
            img = img.convert("RGB")
        tensor = self.transform(img)
        return tensor.unsqueeze(0)  # Add batch dimension

    def preprocess_bytes(self, image_bytes: bytes) -> torch.Tensor:
        """Process raw image bytes."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return self.preprocess_pil(img)

    def denormalize(self, tensor: torch.Tensor) -> torch.Tensor:
        """Convert normalized tensor back to [0, 1] range for visualization."""
        t = tensor.clone()
        for c in range(3):
            t[c] = t[c] * self.std[c] + self.mean[c]
        return torch.clamp(t, 0.0, 1.0)
