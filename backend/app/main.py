from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.app.agents.scam_detection_agent import ScamDetectionAgent

app = FastAPI(
    title="SIH Scam Detection API",
    description="Backend API for real-time scam and fraud detection using Rules, ML, and RAG Agents.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scam_agent = ScamDetectionAgent()

class ScanRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"status": "Online", "message": "SIH Scam Detection Backend is running successfully!"}

@app.post("/api/v1/scan")
def scan_message(payload: ScanRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")
    
    try:
        result = scam_agent.run_pipeline(payload.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))