"""
Shared enums and low-level schema types used across the app.
"""

from enum import Enum


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

    @staticmethod
    def from_score(score: float) -> "RiskLevel":
        if score >= 80:
            return RiskLevel.CRITICAL
        if score >= 55:
            return RiskLevel.HIGH
        if score >= 30:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW


class ScanSource(str, Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"


class ThreatCategory(str, Enum):
    AUTHORITY_IMPERSONATION = "Authority Impersonation"
    DIGITAL_ARREST = "Digital Arrest / Isolation Tactics"
    URGENCY_PRESSURE = "Urgency & Threat Pressure"
    FINANCIAL_FRAUD = "Financial & Identity Fraud Bait"
    PHISHING_REMOTE = "Phishing & Remote-Access Bait"
