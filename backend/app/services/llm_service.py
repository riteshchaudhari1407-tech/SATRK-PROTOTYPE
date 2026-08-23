"""
LLM Service
-------------
Generates the final natural-language forensic explanation.

If ANTHROPIC_API_KEY is set in the environment, this calls Claude to
write a richer, more natural explanation grounded in the rule-engine
signals, ML confidence and retrieved knowledge-base context. If no
key is configured (or the call fails for any reason — offline demo,
rate limit, etc.) it falls back to a carefully written deterministic
template so the app is always fully functional out of the box.
"""

import logging
import os
from dataclasses import dataclass
from typing import List

from app.services.rule_engine_service import CategoryHit

logger = logging.getLogger("satrk.llm")


@dataclass
class AIExplanationResult:
    summary: str
    detailed_explanation: str
    recommended_action: str


class LLMService:
    def __init__(self):
        self.api_key = os.environ.get("ANTHROPIC_API_KEY")
        self._client = None

        if self.api_key:
            try:
                import anthropic

                self._client = anthropic.Anthropic(api_key=self.api_key)
                logger.info("LLM service initialized with Anthropic client.")
            except ImportError:
                logger.warning(
                    "ANTHROPIC_API_KEY set but 'anthropic' package is not "
                    "installed — falling back to template explanations."
                )

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def generate_explanation(
        self,
        text: str,
        risk_level: str,
        final_score: float,
        rule_score: float,
        ml_confidence: float,
        hits: List[CategoryHit],
        rag_context: List[str],
    ) -> AIExplanationResult:
        if self._client:
            try:
                return self._generate_with_llm(
                    text,
                    risk_level,
                    final_score,
                    rule_score,
                    ml_confidence,
                    hits,
                    rag_context,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning("LLM call failed, using fallback: %s", exc)

        return self._generate_fallback(
            risk_level, final_score, rule_score, ml_confidence, hits, rag_context
        )

    # ------------------------------------------------------------------
    # LLM-backed generation
    # ------------------------------------------------------------------

    def _generate_with_llm(
        self,
        text,
        risk_level,
        final_score,
        rule_score,
        ml_confidence,
        hits,
        rag_context,
    ) -> AIExplanationResult:
        category_lines = "\n".join(
            f"- {hit.category} (+{hit.weight} pts): matched \"{hit.excerpt}\""
            for hit in hits
        ) or "- No rule-based categories matched."

        rag_lines = "\n".join(f"- {ctx}" for ctx in rag_context) or "- None retrieved."

        prompt = f"""You are a cybersecurity analyst for Satrk, a scam-detection tool
focused on India's "digital arrest" and authority-impersonation fraud.

Analyze the following message and write a short forensic explanation for
an end user. Be concrete and specific to THIS message — do not write a
generic disclaimer.

MESSAGE:
\"\"\"{text}\"\"\"

AUTOMATED SIGNALS DETECTED:
{category_lines}

ML MODEL CONFIDENCE (0-100 that this is a scam): {ml_confidence}
RULE ENGINE SCORE: {rule_score}
FINAL BLENDED RISK SCORE: {final_score} ({risk_level})

RELEVANT KNOWN SCAM PATTERNS:
{rag_lines}

Write your response as exactly three short paragraphs, separated by a
blank line:
1. A one-sentence verdict summary.
2. A concrete explanation of why, referencing the specific detected
   signals and known pattern above.
3. A clear, actionable recommendation for the user (mention India's
   cyber crime helpline 1930 and cybercrime.gov.in if the risk is
   Medium or above)."""

        response = self._client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )

        full_text = "".join(
            block.text for block in response.content if hasattr(block, "text")
        ).strip()

        paragraphs = [p.strip() for p in full_text.split("\n\n") if p.strip()]

        summary = paragraphs[0] if paragraphs else f"Risk assessment: {risk_level}."
        detailed = full_text
        recommended = (
            paragraphs[-1]
            if len(paragraphs) > 1
            else "Verify independently before taking any action."
        )

        return AIExplanationResult(
            summary=summary,
            detailed_explanation=detailed,
            recommended_action=recommended,
        )

    # ------------------------------------------------------------------
    # Deterministic offline fallback
    # ------------------------------------------------------------------

    def _generate_fallback(
        self, risk_level, final_score, rule_score, ml_confidence, hits, rag_context
    ) -> AIExplanationResult:
        if not hits:
            summary = (
                f"No significant scam indicators were detected. Risk score: "
                f"{final_score}% ({risk_level})."
            )

            ml_note = (
                "which is also low."
                if ml_confidence < 30
                else (
                    "though the learned model alone is not a reliable "
                    "signal without matching rule-based evidence, so the "
                    "final score stays low."
                )
            )

            detailed = (
                f"{summary}\n\n"
                "This message does not match the known structure of a digital-arrest, "
                "authority-impersonation, or financial-phishing scam. The learned model "
                f"independently estimated a {ml_confidence}% likelihood of fraud, {ml_note}\n\n"
                "Even so, never share OTPs, UPI PINs or banking details with anyone, and "
                "treat any unexpected call claiming to be a government agency with caution."
            )

            recommended = (
                "No action needed. Stay generally cautious with unexpected calls or "
                "messages asking for money or personal details."
            )

            return AIExplanationResult(summary, detailed, recommended)

        category_lines = "\n".join(
            f"• {hit.category} (+{hit.weight} pts) — matched \"{hit.excerpt}\""
            for hit in hits
        )

        summary = (
            f"This message was scored {final_score}% risk ({risk_level}) after matching "
            f"{len(hits)} known scam pattern{'s' if len(hits) > 1 else ''}."
        )

        rag_block = ""
        if rag_context:
            rag_lines = "\n".join(f"• {ctx}" for ctx in rag_context)
            rag_block = f"\n\nThis matches known scam patterns:\n{rag_lines}"

        action_severe = (
            "This strongly resembles a scripted impersonation or digital-arrest scam. "
            "Do not make any payment, do not share OTP/UPI details, and do not stay on "
            "a video call under pressure. Real police, CBI or RBI officials never conduct "
            "arrests or investigations over a phone or video call. Report immediately to "
            "India's National Cyber Crime Helpline at 1930 or via cybercrime.gov.in."
        )

        action_moderate = (
            "Some risk indicators are present. Verify the sender independently through "
            "official channels before taking any action. If you're unsure, you can report "
            "it to the National Cyber Crime Helpline at 1930 or cybercrime.gov.in."
        )

        recommended = (
            action_severe if risk_level in ("CRITICAL", "HIGH") else action_moderate
        )

        detailed = (
            f"{summary} The rule engine independently scored {rule_score}% and the "
            f"ML classifier estimated a {ml_confidence}% probability of fraud, both "
            f"contributing to the final blended score.\n\n"
            f"Signals contributing to the score:\n{category_lines}"
            f"{rag_block}\n\n"
            f"{recommended}"
        )

        return AIExplanationResult(summary, detailed, recommended)
