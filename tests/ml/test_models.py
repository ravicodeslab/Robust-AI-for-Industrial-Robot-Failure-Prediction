"""
Unit tests for PyTorch models and multimodal fusion strategies.
Verifies:
- 1D CNN + LSTM tensor shapes
- ResNet18 feature extraction & forward pass
- Concat fusion with multimodal and missing modalities
- Cross-attention fusion with multimodal and missing modalities
"""
import pytest
import torch

from ml.sensor_model.model import Sensor1DCNNLSTM
from ml.vision_model.model import VisionResNet18
from ml.fusion.concat_fusion import ConcatFusionModel
from ml.fusion.attention_fusion import CrossAttentionFusionModel


def test_sensor_model_forward():
    # batch=2, window=128, channels=3
    x = torch.randn(2, 3, 128)
    model = Sensor1DCNNLSTM(input_channels=3, window_size=128, num_classes=8)
    out = model(x)
    assert out.shape == (2, 8)

    embed = model.extract_features(x)
    assert embed.shape == (2, 256)


def test_vision_model_forward():
    # batch=2, channels=3, 224x224
    x = torch.randn(2, 3, 224, 224)
    model = VisionResNet18(pretrained=False, num_classes=8)
    out = model(x)
    assert out.shape == (2, 8)

    feat_map = model.extract_feature_maps(x)
    assert feat_map.shape[1] == 512  # layer4 channels


def test_concat_fusion_multimodal_and_missing():
    s_x = torch.randn(2, 3, 128)
    v_x = torch.randn(2, 3, 224, 224)
    model = ConcatFusionModel(num_classes=8)

    # 1. Both present
    out, status = model(s_x, v_x)
    assert out.shape == (2, 8)
    assert status == "multimodal"

    # 2. Missing vision (sensor only)
    out, status = model(sensor_x=s_x, vision_x=None)
    assert out.shape == (2, 8)
    assert status == "sensor_only"

    # 3. Missing sensor (vision only)
    out, status = model(sensor_x=None, vision_x=v_x)
    assert out.shape == (2, 8)
    assert status == "vision_only"


def test_attention_fusion_multimodal_and_missing():
    s_x = torch.randn(2, 3, 128)
    v_x = torch.randn(2, 3, 224, 224)
    model = CrossAttentionFusionModel(num_classes=8)

    # 1. Both present
    out, status = model(s_x, v_x)
    assert out.shape == (2, 8)
    assert status == "multimodal"

    # 2. Missing vision
    out, status = model(sensor_x=s_x, vision_x=None)
    assert out.shape == (2, 8)
    assert status == "sensor_only"

    # 3. Missing sensor
    out, status = model(sensor_x=None, vision_x=v_x)
    assert out.shape == (2, 8)
    assert status == "vision_only"
