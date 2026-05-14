import os
import sys
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add project root to sys.path to import src.engine
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.engine import VectorInference

app = FastAPI(title="VECTOR VXP2 - Mission Control API", version="2.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Inference Engine
try:
    # Look for model in the project root/models directory
    model_path = os.path.join(PROJECT_ROOT, "models", "rf_v1.pkl")
    engine = VectorInference(model_path=model_path)
except Exception as e:
    print(f"Error loading inference engine: {e}")
    engine = None

# In-memory storage for uploaded data (for prototype/session persistence)
global_telemetry_store: Dict[str, pd.DataFrame] = {}

class PredictionRequest(BaseModel):
    sensor_data: Dict[str, float]
    history: Optional[List[Dict[str, float]]] = None

class PredictionResponse(BaseModel):
    rul: float
    health_percent: float
    is_valid: bool
    message: str
    risk_level: str

def infer_risk_label(rul: float, is_valid: bool) -> str:
    if not is_valid:
        return "CRITICAL"
    if rul < 35:
        return "CRITICAL"
    if rul < 75:
        return "WARNING"
    return "NOMINAL"

def infer_health_percent(rul: float) -> float:
    return min(100.0, max(0.0, (rul / 190.0) * 100.0))

@app.get("/")
async def root():
    return {"status": "ACTIVE", "system": "VECTOR VXP2", "engine_loaded": engine is not None}

@app.post("/v1/telemetry/upload")
async def upload_telemetry(file: UploadFile = File(...)):
    try:
        # Read the file content
        content = await file.read()
        from io import BytesIO
        df = pd.read_csv(BytesIO(content), sep=r'\s+', header=None)
        
        # CMAPSS standard column names
        columns = ['unit', 'cycle', 'op1', 'op2', 'op3'] + [f's{i}' for i in range(1, 22)]
        df.columns = columns[:len(df.columns)]
        
        # Store in memory using filename as key
        global_telemetry_store[file.filename] = df
        
        units = sorted(df['unit'].unique().tolist())
        return {
            "filename": file.filename,
            "units": units,
            "total_records": len(df),
            "status": "LOADED"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file format: {str(e)}")

@app.get("/v1/telemetry/{filename}/{unit_id}")
async def get_unit_telemetry(filename: str, unit_id: int):
    if filename not in global_telemetry_store:
        raise HTTPException(status_code=404, detail="File not found")
    
    df = global_telemetry_store[filename]
    unit_df = df[df['unit'] == unit_id].copy()
    
    if unit_df.empty:
        raise HTTPException(status_code=404, detail="Unit not found in telemetry data")
    
    return unit_df.to_dict(orient="records")

@app.post("/v1/inference/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if engine is None:
        raise HTTPException(status_code=503, detail="Inference engine not loaded")
    
    try:
        # Map CMAPSS sensor names to physical names for the guardrail
        # s4 = T30, s8 = P30
        enriched_data = {**request.sensor_data}
        if "s4" in enriched_data: enriched_data["t30"] = enriched_data["s4"]
        if "s4" in enriched_data: enriched_data["t30"] = enriched_data["s4"]
        if "s8" in enriched_data: enriched_data["p30"] = enriched_data["s8"]
        
        # Pass history to engine for LSTM support
        rul = engine.predict_rul(request.sensor_data, history=request.history)
        is_valid, msg = engine.physics_guardrail(enriched_data)
        
        return PredictionResponse(
            rul=rul,
            health_percent=infer_health_percent(rul),
            is_valid=is_valid,
            message=msg,
            risk_level=infer_risk_label(rul, is_valid)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
