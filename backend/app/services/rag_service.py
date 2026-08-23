"""
RAG Service (Retrieval Augmented Generation)
-----------------------------------------------
A small, self-contained retriever over a curated knowledge base of
known Indian scam patterns. No external vector database is needed —
TF-IDF + cosine similarity over an in-memory corpus is enough to
retrieve the most relevant known-pattern context for a given
message, which is then handed to the explanation agent so its output
cites real, recognizable fraud patterns instead of generic text.
"""

from dataclasses import dataclass
from typing import List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class KnowledgeEntry:
    id: str
    title: str
    summary: str


KNOWLEDGE_BASE: List[KnowledgeEntry] = [
    KnowledgeEntry(
        id="kb-digital-arrest",
        title="Digital Arrest Scam",
        summary=(
            "Scammers impersonate CBI, police or RBI officials on a video call, "
            "claim the victim is linked to a crime (often parcel/drugs/money "
            "laundering), and keep them isolated on camera under fake 'virtual "
            "custody' until money is transferred. Real agencies never conduct "
            "arrests or investigations over video call."
        ),
    ),
    KnowledgeEntry(
        id="kb-courier-parcel",
        title="Courier / Customs Parcel Scam",
        summary=(
            "A caller claims a parcel addressed to the victim (often via FedEx, "
            "DHL, or India Post) contains illegal items such as drugs or fake "
            "documents, and threatens legal action unless a 'customs fee' or "
            "fine is paid immediately."
        ),
    ),
    KnowledgeEntry(
        id="kb-kyc-otp-phishing",
        title="KYC / OTP Banking Phishing",
        summary=(
            "Messages impersonating a bank claim KYC has expired or the account "
            "will be frozen, pressuring the victim to share OTP, UPI PIN or card "
            "details, or to click a shortened link that leads to a fake banking "
            "page."
        ),
    ),
    KnowledgeEntry(
        id="kb-lottery-prize",
        title="Lottery / Prize Scam",
        summary=(
            "The victim is told they have won a large cash prize or lottery and "
            "must pay a small 'processing fee' or 'tax' upfront to release the "
            "winnings, which never actually arrive."
        ),
    ),
    KnowledgeEntry(
        id="kb-loan-app-harassment",
        title="Instant Loan App Harassment",
        summary=(
            "Predatory loan apps or fake recruiters demand a refundable "
            "'security deposit' before releasing a loan or job offer, then "
            "pressure or threaten the victim once payment is made."
        ),
    ),
    KnowledgeEntry(
        id="kb-remote-access",
        title="Remote Access / Tech Support Scam",
        summary=(
            "A caller posing as bank or telecom support asks the victim to "
            "install AnyDesk or TeamViewer 'to fix an issue', then uses that "
            "access to steal banking credentials directly from the device."
        ),
    ),
    KnowledgeEntry(
        id="kb-sextortion",
        title="Video-Call Sextortion",
        summary=(
            "Scammers record a compromising video call and threaten to share it "
            "with the victim's contacts unless a payment is made immediately."
        ),
    ),
]


class RAGService:
    def __init__(self, knowledge_base: List[KnowledgeEntry] = None):
        self.knowledge_base = knowledge_base or KNOWLEDGE_BASE

        corpus = [entry.summary for entry in self.knowledge_base]

        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        self._matrix = self.vectorizer.fit_transform(corpus)

    def retrieve(self, text: str, top_k: int = 2, min_similarity: float = 0.08) -> List[str]:
        """Return up to top_k relevant knowledge-base summaries, formatted
        for direct inclusion in the explanation, skipping anything below
        the similarity floor so unrelated benign text retrieves nothing."""
        if not text.strip():
            return []

        query_vector = self.vectorizer.transform([text])
        similarities = cosine_similarity(query_vector, self._matrix)[0]

        ranked = sorted(
            zip(self.knowledge_base, similarities),
            key=lambda pair: pair[1],
            reverse=True,
        )

        results = []

        for entry, score in ranked[:top_k]:
            if score < min_similarity:
                continue
            results.append(f"{entry.title}: {entry.summary}")

        return results
