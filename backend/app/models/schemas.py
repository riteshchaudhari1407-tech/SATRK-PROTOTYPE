from pydantic import BaseModel, Field
from typing import Dict, Any

# Input Schema
class ScanInputModel(BaseModel):
    message: str = Field(..., description="The suspicious message, text, or OCR extracted text to be scanned.")

# Result Schema
class ScanResultModel(BaseModel):
    success: bool
    original_message: str
    cleaned_message: str
    risk_assessment: Dict[str, Any]
    rule_details: Dict[str, Any]
    ml_details: Dict[str, Any]
    ai_explanation: Dict[str, Any]