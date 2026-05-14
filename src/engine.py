"""
VECTOR VXP2 — Inference Engine
Loads a trained Random Forest model and predicts Remaining Useful Life (RUL)
with physics-based safety validation for turbofan engine sensor data.
"""

import os
import joblib
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout


class VectorInference:
    """Core inference engine for turbofan engine health prediction."""

    # ---------- Physics constants for compressor P30/T30 check ----------
    # Expected ratio range derived from isentropic compressor relationships.
    # Values outside this band indicate sensor fault or physical implausibility.
    P30_T30_RATIO_LOW = 0.020   # lower bound (psi / °R)
    P30_T30_RATIO_HIGH = 0.065  # upper bound (psi / °R)

    # RUL threshold below which the engine is considered critical
    RUL_CRITICAL_THRESHOLD = 30

    def __init__(self, model_path: str = None):
        """
        Initialize the inference engine. Supports .pkl (Random Forest) 
        and .h5 (Deep Learning LSTM) models.
        """
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            # Default to LSTM if it exists, otherwise fallback to RF
            lstm_path = os.path.join(base_dir, "models", "vxp2_lstm_v1.h5")
            rf_path = os.path.join(base_dir, "models", "rf_v1.pkl")
            model_path = lstm_path if os.path.exists(lstm_path) else rf_path

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at '{model_path}'")

        self.model_path = model_path
        self.is_lstm = model_path.endswith('.h5')
        
        if self.is_lstm:
            self.model = load_model(model_path)
        else:
            self.model = joblib.load(model_path)

    # ------------------------------------------------------------------ #
    #  Physics-based validation                                          #
    # ------------------------------------------------------------------ #
    def physics_guardrail(self, sensor_data: dict) -> tuple:
        """
        Validate that the P30 / T30 ratio falls within the expected
        compressor pressure-temperature relationship.
        """
        sensor_data = {str(k).lower(): v for k, v in sensor_data.items()}
        p30 = sensor_data.get("p30")
        t30 = sensor_data.get("t30")

        if p30 is None or t30 is None:
            return False, "Missing P30 or T30 sensor reading."

        if t30 == 0:
            return False, "T30 is zero — invalid temperature reading."

        ratio = p30 / t30
        within_bounds = self.P30_T30_RATIO_LOW <= ratio <= self.P30_T30_RATIO_HIGH

        if within_bounds:
            message = f"P30/T30 ratio ({ratio:.4f}) within expected bounds. Compressor nominal."
        else:
            message = f"⚠ P30/T30 ratio ({ratio:.4f}) OUTSIDE expected bounds. Sensor anomaly detected."

        return within_bounds, message

    def predict_rul(self, data_row: dict, history: list = None) -> float:
        """
        Predict Remaining Useful Life. 
        If LSTM is active, it uses the provided history (last 50 cycles).
        """
        # 1. Standardize column names
        data_row = {str(k).lower(): v for k, v in data_row.items()}
        
        # 2. Extract features (s1 - s21)
        current_features = []
        for i in range(1, 22):
            val = data_row.get(f"s{i}", 0.0)
            current_features.append(val)
        
        if self.is_lstm:
            # Deep Learning Path: Requires 50-cycle window
            window_size = 50
            if history and len(history) >= window_size:
                # Use actual history
                seq = []
                for h_row in history[-window_size:]:
                    h_row = {str(k).lower(): v for k, v in h_row.items()}
                    seq.append([h_row.get(f"s{i}", 0.0) for i in range(1, 22)])
                input_data = np.array([seq])
            else:
                # Pad with current row if history is insufficient
                seq = [current_features] * window_size
                input_data = np.array([seq])
            
            prediction = self.model.predict(input_data, verbose=0)
            rul_val = float(prediction[0][0])
        else:
            # Legacy RF Path
            feature_array = np.array(current_features).reshape(1, -1)
            rul_val = float(self.model.predict(feature_array)[0])
            
        return round(max(0, rul_val), 2)

class VectorLSTM:
    """Blueprint for the Vector Deep Learning Architecture."""
    def __init__(self, window_size=50, feature_count=21):
        self.model = Sequential([
            LSTM(units=100, return_sequences=True, input_shape=(window_size, feature_count)),
            Dropout(0.2),
            LSTM(units=50, return_sequences=False),
            Dropout(0.2),
            Dense(units=1)
        ])
        self.model.compile(optimizer='adam', loss='mse')
