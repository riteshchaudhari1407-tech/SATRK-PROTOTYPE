"""
Scam Detection Agent
-----------------------
Orchestrates the detection pipeline: text preprocessing, rule-based
pattern matching, ML classification, RAG retrieval of known patterns,
and final risk scoring. Produces a single structured result that the
explanation agent and API layer both consume.
"""

from dataclasses import dataclass
from typing import List

from app.services.ml_detection_service import MLDetectionService
from app.services.rag_service import RAGService
from app.services.risk_engine_service import FinalRisk, RiskEngineService
from app.services.rule_engine_service import CategoryHit, RuleEngineService
from app.services.text_processing_service import TextProcessingService


@dataclass
class DetectionResult:
    raw_text: str
    final_risk: FinalRisk
    hits: List[CategoryHit]
    rag_context: List[str]


class ScamDetectionAgent:
    def __init__(self):
        self.text_processor = TextProcessingService()
        self.rule_engine = RuleEngineService()
        self.ml_detector = MLDetectionService()
        self.rag = RAGService()
        self.risk_engine = RiskEngineService()

    def detect(self, raw_text: str) -> DetectionResult:
        cleaned = self.text_processor.clean(raw_text)

        # Rule engine works on the raw text so excerpts keep original
        # casing/punctuation for a readable citation.
        rule_result = self.rule_engine.analyze(raw_text)

        ml_confidence = self.ml_detector.predict(cleaned)

        rag_context = self.rag.retrieve(raw_text, top_k=2)

        final_risk = self.risk_engine.combine(rule_result, ml_confidence)

        return DetectionResult(
            raw_text=raw_text,
            final_risk=final_risk,
            hits=rule_result.hits,
            rag_context=rag_context,
        )
