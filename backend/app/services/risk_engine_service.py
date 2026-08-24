"""
Risk Engine Service
---------------------
Combines the deterministic rule-engine score with the ML model's
learned probability into a single final risk score. The rule engine
is weighted higher because it is fully explainable (every point maps
to a concrete matched phrase), while the ML score acts as a
corroborating or dampening signal for phrasing the rule engine
doesn't explicitly cover.
"""

from dataclasses import dataclass

from app.models.schemas import RiskLevel
from app.services.rule_engine_service import RuleEngineResult
from app.utils.helpers import clamp

RULE_WEIGHT = 0.80
ML_WEIGHT = 0.20


@dataclass
class FinalRisk:
    score: float
    risk_level: RiskLevel
    rule_score: float
    ml_confidence: float


class RiskEngineService:
    def combine(
        self, rule_result: RuleEngineResult, ml_confidence: float
    ) -> FinalRisk:
        rule_score = clamp(rule_result.score)
        ml_score = clamp(ml_confidence)

        # If the rule engine sees literally no known scam category, treat
        # that as strong evidence the message is benign, regardless of what
        # the ML model says — a tiny classifier can be noisy on
        # out-of-distribution text, so it should only ever nudge the score
        # up slightly here, never dominate it.
        if rule_result.distinct_categories == 0:
            blended = ml_score * 0.18
        else:
            blended = (rule_score * RULE_WEIGHT) + (ml_score * ML_WEIGHT)

        final_score = round(clamp(blended), 1)

        return FinalRisk(
            score=final_score,
            risk_level=RiskLevel.from_score(final_score),
            rule_score=round(rule_score, 1),
            ml_confidence=round(ml_score, 1),
        )
