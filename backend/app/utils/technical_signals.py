"""
Technical Safety Signal Layer (Layer C)
------------------------------------------
Deliberately narrow: this only flags concrete, low-level technical
patterns (URLs, phone numbers, explicit OTP/payment requests,
shouting/urgency formatting). It is a SUPPORTING signal only — see
analysis_service.py's aggregation logic, where this layer contributes
a small, capped portion of the final score. It must never be the
primary or sole basis for a verdict; that role belongs to the
semantic (Layer A) and LLM (Layer B) engines.
"""

import re
from typing import List, TypedDict

# Hard cap on how much this layer alone can move the final score.
MAX_TECHNICAL_CONTRIBUTION = 20.0


class TechnicalSignal(TypedDict):
    signal: str
    severity: str
    evidence: str
    weight: float


_URL_PATTERN = re.compile(
    r"(https?://\S+|www\.\S+|bit\.ly/\S+|tinyurl\.com/\S+)", re.IGNORECASE
)
_PHONE_PATTERN = re.compile(r"\b(?:\+91[-\s]?)?[6-9]\d{9}\b")
_OTP_REQUEST_PATTERN = re.compile(
    r"\b(share|send|tell me|provide)\b.{0,20}\b(otp|one[-\s]?time password|pin)\b",
    re.IGNORECASE,
)
_PAYMENT_PATTERN = re.compile(
    r"\b(transfer|pay|deposit)\b.{0,25}\b(amount|money|fee|fine|rs\.?|₹|inr)\b",
    re.IGNORECASE,
)
_REMOTE_ACCESS_PATTERN = re.compile(
    r"\b(anydesk|teamviewer|remote access|screen share)\b", re.IGNORECASE
)


def extract_technical_signals(text: str) -> List[TechnicalSignal]:
    signals: List[TechnicalSignal] = []

    url_match = _URL_PATTERN.search(text)
    if url_match:
        signals.append(
            {
                "signal": "Suspicious link present",
                "severity": "MEDIUM",
                "evidence": url_match.group(0),
                "weight": 5.0,
            }
        )

    otp_match = _OTP_REQUEST_PATTERN.search(text)
    if otp_match:
        signals.append(
            {
                "signal": "Direct OTP/credential request",
                "severity": "HIGH",
                "evidence": otp_match.group(0),
                "weight": 8.0,
            }
        )

    payment_match = _PAYMENT_PATTERN.search(text)
    if payment_match:
        signals.append(
            {
                "signal": "Payment/money-transfer demand",
                "severity": "HIGH",
                "evidence": payment_match.group(0),
                "weight": 7.0,
            }
        )

    remote_match = _REMOTE_ACCESS_PATTERN.search(text)
    if remote_match:
        signals.append(
            {
                "signal": "Remote-access tool mentioned",
                "severity": "HIGH",
                "evidence": remote_match.group(0),
                "weight": 6.0,
            }
        )

    phone_match = _PHONE_PATTERN.search(text)
    if phone_match:
        signals.append(
            {
                "signal": "Phone number present in message",
                "severity": "LOW",
                "evidence": phone_match.group(0),
                "weight": 2.0,
            }
        )

    exclamations = text.count("!")
    upper_words = len(re.findall(r"\b[A-Z]{4,}\b", text))

    if exclamations >= 2 or upper_words >= 1:
        signals.append(
            {
                "signal": "Excessive urgency formatting",
                "severity": "LOW",
                "evidence": f"{exclamations} exclamation marks, "
                f"{upper_words} all-caps word(s) detected.",
                "weight": 3.0,
            }
        )

    return signals


def technical_score(signals: List[TechnicalSignal]) -> float:
    """Sums weights but hard-caps the contribution — this layer supports,
    it never dominates."""
    total = sum(signal["weight"] for signal in signals)
    return min(total, MAX_TECHNICAL_CONTRIBUTION)
