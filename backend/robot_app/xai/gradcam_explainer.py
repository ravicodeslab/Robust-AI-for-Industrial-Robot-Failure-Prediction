"""
Grad-CAM (Gradient-weighted Class Activation Mapping) Explainer for Vision ResNet18.
Computes gradients of target failure score with respect to layer4 feature activations.
Generates genuine activation heatmap and overlay on the inspection image.
"""
from __future__ import annotations

import base64
import io
from typing import Any, Dict, Optional, Tuple

import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn.functional as F

from robot_app.ml.demo_generator import image_to_base64
from ml.vision_model.model import VisionResNet18


class GradCamExplainer:
    def __init__(self, model: VisionResNet18):
        self.model = model
        self.feature_maps: Optional[torch.Tensor] = None
        self.gradients: Optional[torch.Tensor] = None

        # Register forward and backward hooks on layer4
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.feature_maps = output

        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0]

        target_layer = self.model.layer4
        target_layer.register_forward_hook(forward_hook)
        target_layer.register_full_backward_hook(backward_hook)

    def generate_cam(
        self,
        input_tensor: torch.Tensor,
        original_pil: Image.Image,
        target_class_idx: int,
        predicted_class_name: str,
        confidence: float,
    ) -> Dict[str, Any]:
        """
        Runs forward pass, computes backward gradients for target_class_idx,
        and produces heatmap and overlay images.
        """
        self.model.eval()
        self.model.zero_grad()

        # Forward pass
        logits = self.model(input_tensor)
        score = logits[0, target_class_idx]
        score.backward(retain_graph=True)

        if self.feature_maps is None or self.gradients is None:
            raise RuntimeError("Grad-CAM hooks failed to capture feature maps or gradients.")

        # Global average pooling of gradients: weights alpha_k
        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)  # (1, 512, 1, 1)

        # Weighted combination of activation maps
        cam = torch.sum(weights * self.feature_maps, dim=1, keepdim=True)  # (1, 1, H_cam, W_cam)
        cam = F.relu(cam)  # Apply ReLU to keep features that positively contribute

        # Normalize CAM to [0, 1]
        cam_np = cam.squeeze().detach().cpu().numpy()
        cam_min, cam_max = np.min(cam_np), np.max(cam_np)
        if cam_max - cam_min > 1e-6:
            cam_norm = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_norm = np.zeros_like(cam_np)

        # Resize CAM to match original image dimensions
        orig_w, orig_h = original_pil.size
        heatmap_resized = cv2.resize(cam_norm, (orig_w, orig_h))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)

        # Apply Jet colormap
        heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        heatmap_color_rgb = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

        # Create overlay
        orig_np = np.array(original_pil)
        overlay_np = np.uint8(0.6 * orig_np + 0.4 * heatmap_color_rgb)

        heatmap_pil = Image.fromarray(heatmap_color_rgb)
        overlay_pil = Image.fromarray(overlay_np)

        # Determine attention region description
        cy, cx = np.unravel_index(np.argmax(heatmap_resized), heatmap_resized.shape)
        rel_x = cx / orig_w
        rel_y = cy / orig_h
        
        region_desc = "central raceway"
        if rel_x < 0.4:
            region_desc = "left-side assembly perimeter"
        elif rel_x > 0.6:
            region_desc = "right-side contact bearing surface"
        if rel_y < 0.3:
            region_desc = "upper bearing race interface"
        elif rel_y > 0.7:
            region_desc = "lower mounting flange"

        attention_text = (
            f"Model attention concentrated around the {region_desc}, "
            f"identifying localized surface anomalies associated with {predicted_class_name}."
        )

        return {
            "predicted_class": predicted_class_name,
            "confidence": confidence,
            "original_image_base64": image_to_base64(original_pil),
            "heatmap_base64": image_to_base64(heatmap_pil),
            "overlay_base64": image_to_base64(overlay_pil),
            "attention_region_description": attention_text,
        }
