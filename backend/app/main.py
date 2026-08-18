from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.services.text_processing_service import TextProcessingService
from app.services.rule_engine_service import RuleEngine
from app.services.ml_detection_service import MLDetectionService
from app.services.risk_engine_service import RiskEngineService
from app.agents.explanation_agent import ExplanationAgent

app = FastAPI(
    title="Anti-Scam & Digital Arrest Detection API",
    description="Professional backend architecture for cyber scam detection and AI explanation.",
    version="1.0.0"
)


text_processor = TextProcessingService()
rule_engine = RuleEngine()
ml_service = MLDetectionService()
risk_engine = RiskEngineService()
explanation_agent = ExplanationAgent()

class ScanRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {"status": "Active", "message": "Anti-Scam Backend is running successfully!"}

@app.post("/api/v1/scan")
def scan_message(payload: ScanRequest):
    try:
        raw_text = payload.message
        
        
        cleaned_text = text_processor.clean_and_normalize_text(raw_text)
        if not cleaned_text:
            raise HTTPException(status_code=400, detail="Provided message is empty or invalid.")
        
        
        rule_res = rule_engine.analyze_text(cleaned_text)
        
        
        ml_res = ml_service.analyze_text(cleaned_text)
        
        
        risk_res = risk_engine.evaluate(
            rule_score=rule_res["rule_score"],
            keyword_matches_count=len(rule_res["signals"])
        )
        
        
        agent_res = explanation_agent.run(
            scam_text=cleaned_text,
            signals=rule_res["signals"],
            risk_level=risk_res["risk_level"]
        )
        
        
        return {
            "success": True,
            "original_message": raw_text,
            "cleaned_message": cleaned_text,
            "risk_assessment": risk_res,
            "rule_details": rule_res,
            "ml_details": ml_res,
            "ai_explanation": agent_res
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)