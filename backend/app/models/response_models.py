from pydantic import BaseModel
from typing import List, Dict, Any

class RiskAssessmentModel(BaseModel):
    risk_level: str
    risk_score: int
    summary: str

class ScanResponseModel(BaseModel):
    success: bool
    original_message: str
    cleaned_message: str
    risk_assessment: Dict[str, Any]
    rule_details: Dict[str, Any]
    ml_details: Dict[str, Any]
    ai_explanation: Dict[str, Any]