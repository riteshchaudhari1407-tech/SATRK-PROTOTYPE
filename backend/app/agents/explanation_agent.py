"""
Explanation Agent
--------------------
Takes a completed detection result and produces the final natural-
language explanation shown to the user, via the LLM service (with
its built-in offline fallback).
"""

from app.agents.scam_detection_agent import DetectionResult
from app.services.llm_service import AIExplanationResult, LLMService


class ExplanationAgent:
    def __init__(self):
        self.llm_service = LLMService()

    def explain(self, detection: DetectionResult) -> AIExplanationResult:
        return self.llm_service.generate_explanation(
            text=detection.raw_text,
            risk_level=detection.final_risk.risk_level.value,
            final_score=detection.final_risk.score,
            rule_score=detection.final_risk.rule_score,
            ml_confidence=detection.final_risk.ml_confidence,
            hits=detection.hits,
            rag_context=detection.rag_context,
        )
