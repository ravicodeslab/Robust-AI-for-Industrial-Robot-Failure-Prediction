import sys
from pathlib import Path

# Add project root to sys.path so ml.* is directly importable
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ml.sensor_model.model import Sensor1DCNNLSTM

__all__ = ["Sensor1DCNNLSTM"]
