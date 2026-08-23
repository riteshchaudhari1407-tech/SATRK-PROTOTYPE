"""
Text Processing Service
------------------------
Light preprocessing and feature extraction shared by the rule engine,
ML model and RAG retriever. Kept dependency-free (no heavy NLP
library) so the backend starts instantly with no model downloads.
"""

import re
from dataclasses import dataclass


@dataclass
class TextFeatures:
    length: int
    word_count: int
    exclamation_count: int
    upper_word_count: int
    digit_count: int
    has_url: bool
    has_currency_symbol: bool


class TextProcessingService:
    def clean(self, text: str) -> str:
        """Lowercase + collapse whitespace for ML/RAG matching. Original
        casing is preserved separately wherever excerpts are shown to
        the user."""
        text = text or ""
        text = re.sub(r"\s+", " ", text).strip()
        return text.lower()

    def extract_features(self, text: str) -> TextFeatures:
        text = text or ""

        return TextFeatures(
            length=len(text),
            word_count=len(text.split()),
            exclamation_count=text.count("!"),
            upper_word_count=len(re.findall(r"\b[A-Z]{4,}\b", text)),
            digit_count=len(re.findall(r"\d", text)),
            has_url=bool(re.search(r"https?://|bit\.ly/|tinyurl\.com/", text)),
            has_currency_symbol=bool(re.search(r"[₹$]|\brs\.?\b", text, re.IGNORECASE)),
        )
