"""
Pydantic response models returned by the API.

Field names are kept intentionally close to what the Satrk frontend
already expects (risk_score, risk_level, explanation, signals) so no
extra mapping layer is needed on the client.
"""

from typing import List, Optional

from pydantic import BaseModel

from app.models.schemas import RiskLevel, ScanSource


class DetectedSignal(BaseModel):
    category: str
    weight: int
    excerpt: str
    description: str


class AIExplanation(BaseModel):
    summary: str
    detailed_explanation: str
    recommended_action: str


class ScanResponse(BaseModel):
    id: str
    timestamp: str
    source: ScanSource

    risk_score: float
    risk_level: RiskLevel

    rule_score: float
    ml_confidence: float

    signals: List[str]
    detected_signals: List[DetectedSignal]

    rag_context: List[str]

    ai_explanation: AIExplanation
    explanation: str

    extracted_text: Optional[str] = None


class IncidentSummary(BaseModel):
    id: str
    title: str
    source: str
    time: str
    risk: RiskLevel
    score: int


class I4CReportResponse(BaseModel):
    status: str
    i4c_tracking_id: str
    message: str
