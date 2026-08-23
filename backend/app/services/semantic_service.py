"""
Semantic Service (Layer A — Semantic / Context Understanding)
-----------------------------------------------------------------
This is NOT a keyword matcher. It embeds the user's message with a
sentence-transformer model and compares it, via cosine similarity, to
curated exemplar sentences for each scam-relevant category. This lets
the system recognize paraphrased or reworded scam language ("your
identity verification needs immediate renewal" vs "your KYC is
outdated") because both map to similar points in embedding space,
even though they share no keywords.

Model: sentence-transformers/all-MiniLM-L6-v2 — chosen deliberately
because it is small (~80MB), fast on CPU (no GPU required, <50ms per
message), and reliable for short-sentence semantic similarity, which
fits an SIH hackathon demo far better than a large LLM-sized encoder.

Calibration note: raw cosine similarity between unrelated short
sentences from this model typically sits around 0.15-0.30 due to how
the embedding space is shaped, while genuinely related sentences
score 0.45-0.75+. The FLOOR/CEILING constants below calibrate that
raw range into an interpretable 0-100 scale; they were chosen by
inspecting similarity scores across the exemplar set below, not
picked arbitrarily.
"""

import logging
from typing import Dict, List

logger = logging.getLogger("satrk.semantic")

# Raw cosine similarity calibration band for all-MiniLM-L6-v2.
SIMILARITY_FLOOR = 0.28
SIMILARITY_CEILING = 0.74

# Below this normalized score, a category is not considered "matched"
# at all (too close to background noise).
MATCH_THRESHOLD = 18.0

CATEGORY_EXEMPLARS: Dict[str, List[str]] = {
    "Urgency Manipulation": [
        "You must act immediately or face serious consequences.",
        "This needs to be resolved right now, there is no time to waste.",
        "Failure to respond within the next few minutes will result in action against you.",
        "Act now, this is your final opportunity to avoid a penalty.",
    ],
    "Fear / Threat Language": [
        "You will be arrested if you do not comply.",
        "Serious legal consequences will follow if you ignore this.",
        "This is a criminal matter and you could go to jail.",
        "Failure to cooperate will lead to your arrest.",
    ],
    "Authority Impersonation": [
        "This is an officer from a government law enforcement agency.",
        "I am calling from the central investigation bureau regarding your case.",
        "This call is from the regulatory authority overseeing your account.",
        "An official from the crime investigation department needs to speak with you.",
    ],
    "Arrest / Digital Custody Threats": [
        "You are under arrest and must stay on this call.",
        "Do not disconnect, you are currently under digital custody.",
        "You cannot leave this video call until the investigation concludes.",
        "You are being monitored and must remain available for questioning at all times.",
    ],
    "Legal Intimidation": [
        "A warrant has been issued against you.",
        "Legal proceedings have already begun in your name.",
        "The court has registered a case against you that requires urgent action.",
        "There is a pending legal notice that demands your immediate response.",
    ],
    "Account Suspension Threat": [
        "Your account will be permanently suspended unless you act now.",
        "Your banking access will be restricted if you do not verify immediately.",
        "Your service will be blocked within hours if this is not resolved.",
        "Failure to confirm your details will result in account closure.",
    ],
    "KYC / Identity Verification Fraud": [
        "Your identity verification needs immediate renewal.",
        "Please complete your KYC update to avoid disruption.",
        "Your documents require urgent re-verification through this link.",
        "Update your account details now to remain compliant.",
    ],
    "OTP / Credential Demand": [
        "Please share the one-time password sent to your phone.",
        "Tell me the code you just received to verify your identity.",
        "I need your password to confirm this transaction.",
        "Read out the verification number so I can process this for you.",
    ],
    "Suspicious Payment Demand": [
        "Please transfer the amount immediately to avoid penalties.",
        "You need to pay a fee right now to release your pending item.",
        "Send the money to this account to resolve the issue.",
        "A refundable deposit is required before we can proceed.",
    ],
    "Remote Access Request": [
        "Please install this remote access application so I can help you.",
        "Download this tool and give me control of your screen.",
        "Let me connect to your device remotely to fix the problem.",
        "Grant access to your computer so our technician can resolve this.",
    ],
    "Isolation Tactics": [
        "Do not tell anyone about this conversation.",
        "You must handle this alone without informing your family.",
        "Keep this strictly between us for the investigation to work.",
        "Do not discuss this call with anyone else.",
    ],
    "Secrecy Instructions": [
        "This is a confidential matter that must not be disclosed.",
        "Keep this information completely secret from everyone.",
        "This is a top secret investigation, do not share any details.",
        "You are not authorized to tell anyone about this call.",
    ],
    "Phishing / Suspicious Link Intent": [
        "Click this link right away to verify your account.",
        "Follow this link to secure your details before it's too late.",
        "Open the attached link to complete the required action.",
        "Use this link to confirm your identity within the next hour.",
    ],
    "Coercion / Psychological Manipulation": [
        "You have no choice but to comply with these instructions.",
        "If you do not follow these steps exactly, things will get worse for you.",
        "You must do exactly as I say without asking questions.",
        "There is no other option available to you right now.",
    ],
}

BENIGN_EXEMPLARS: List[str] = [
    "Hey, are we still on for lunch tomorrow?",
    "Your package will be delivered by Friday.",
    "The meeting has been moved to 3pm today.",
    "Thanks for sending the report, it looks great.",
    "Your electricity bill for this month is now available to view.",
    "Happy birthday, hope you have a wonderful day.",
    "Can you send me the invoice when you get a chance?",
    "Reminder: your appointment is scheduled for next week.",
    "Your order has shipped and will arrive soon.",
    "Let's catch up over the weekend.",
    "The weather looks great for our trip this weekend.",
    "Please review the attached document whenever convenient.",
    "Your subscription renews automatically next month.",
    "Congratulations on completing the course.",
    "Just checking in, how are you doing?",
]


def _normalize(similarity: float) -> float:
    span = SIMILARITY_CEILING - SIMILARITY_FLOOR
    normalized = (similarity - SIMILARITY_FLOOR) / span
    return max(0.0, min(1.0, normalized)) * 100


class SemanticService:
    def __init__(self):
        self.available = False
        self.model = None
        self._category_embeddings = None
        self._benign_embeddings = None

        try:
            from sentence_transformers import SentenceTransformer, util

            self._util = util
            self.model = SentenceTransformer(
                "sentence-transformers/all-MiniLM-L6-v2"
            )

            self._category_embeddings = {
                category: self.model.encode(
                    sentences, convert_to_tensor=True
                )
                for category, sentences in CATEGORY_EXEMPLARS.items()
            }

            self._benign_embeddings = self.model.encode(
                BENIGN_EXEMPLARS, convert_to_tensor=True
            )

            self.available = True
            logger.info("Semantic service loaded (all-MiniLM-L6-v2).")
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Semantic service unavailable — sentence-transformers "
                "could not be loaded: %s",
                exc,
            )

    def analyze(self, text: str) -> dict:
        """Returns a dict with: available, semantic_score (0-100),
        matched_categories (list of {category, similarity})."""

        if not self.available:
            return {
                "available": False,
                "semantic_score": 0,
                "matched_categories": [],
            }

        # --- Whitelist Check for Legitimate Bank Alerts ---
        lower_text = text.lower()
        if ("credited by" in lower_text or "debited by" in lower_text or "a/c" in lower_text) and ("ref no" in lower_text or "txn" in lower_text or "upi" in lower_text or "transfer from" in lower_text or "rs." in lower_text):
            return {
                "available": True,
                "semantic_score": 0.0,
                "matched_categories": [],
            }
        # -------------------------------------------------

        text_embedding = self.model.encode(
            text, convert_to_tensor=True
        )

        category_scores = []

        for category, embeddings in self._category_embeddings.items():
            similarities = self._util.cos_sim(
                text_embedding, embeddings
            )[0]

            best_similarity = float(similarities.max())
            normalized = _normalize(best_similarity)

            if normalized >= MATCH_THRESHOLD:
                category_scores.append(
                    {
                        "category": category,
                        "similarity": round(normalized, 1),
                    }
                )

        category_scores.sort(
            key=lambda item: item["similarity"], reverse=True
        )

        benign_similarities = self._util.cos_sim(
            text_embedding, self._benign_embeddings
        )[0]

        benign_score = _normalize(float(benign_similarities.max()))

        if not category_scores:
            semantic_score = 0.0
        else:
            base = category_scores[0]["similarity"]
            bonus = sum(
                item["similarity"] * 0.2
                for item in category_scores[1:3]
            )
            semantic_score = min(100.0, base + bonus)

            if benign_score > semantic_score:
                damp_factor = max(
                    0.3, 1 - (benign_score - semantic_score) / 100
                )
                semantic_score *= damp_factor

        return {
            "available": True,
            "semantic_score": round(semantic_score, 1),
            "matched_categories": category_scores[:6],
        }