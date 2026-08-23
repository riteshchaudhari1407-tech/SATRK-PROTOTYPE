"""
Scam Detection Workflow
--------------------------
The single entry point used by the API layer. Wires together the
detection agent, explanation agent and OCR service, and manages a
lightweight JSON-file-backed store of recent scans / I4C reports so
the dashboard has real, persistent data across restarts without
needing a database.
"""

import json
import logging
import threading
from pathlib import Path
from typing import List

from app.agents.explanation_agent import ExplanationAgent
from app.agents.scam_detection_agent import DetectionResult, ScamDetectionAgent
from app.models.response_models import (
    AIExplanation,
    DetectedSignal,
    IncidentSummary,
    ScanResponse,
)
from app.models.schemas import ScanSource
from app.services.ocr_service import OCRService
from app.utils.helpers import generate_id, humanize_time_ago, now_iso

logger = logging.getLogger("satrk.workflow")

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

SCANS_FILE = DATA_DIR / "scans.json"
REPORTS_FILE = DATA_DIR / "i4c_reports.json"

MAX_STORED_SCANS = 300


class ScamDetectionWorkflow:
    def __init__(self):
        self.detection_agent = ScamDetectionAgent()
        self.explanation_agent = ExplanationAgent()
        self.ocr_service = OCRService()

        self._lock = threading.Lock()
        self._scans: List[dict] = self._load_json(SCANS_FILE)
        self._reports: List[dict] = self._load_json(REPORTS_FILE)

    # ------------------------------------------------------------------
    # Persistence helpers
    # ------------------------------------------------------------------

    def _load_json(self, path: Path) -> List[dict]:
        if not path.exists():
            return []

        try:
            with path.open("r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("Could not load %s: %s", path, exc)
            return []

    def _save_json(self, path: Path, data: List[dict]) -> None:
        try:
            with path.open("w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except OSError as exc:
            logger.warning("Could not save %s: %s", path, exc)

    # ------------------------------------------------------------------
    # Text scan
    # ------------------------------------------------------------------

    def run_text_scan(self, raw_text: str) -> ScanResponse:
        detection = self.detection_agent.detect(raw_text)
        return self._finalize(detection, source=ScanSource.TEXT)

    # ------------------------------------------------------------------
    # Image scan (OCR -> text scan)
    # ------------------------------------------------------------------

    def run_image_scan(self, image_bytes: bytes) -> ScanResponse:
        extracted_text = self.ocr_service.extract_text(image_bytes)

        detection = self.detection_agent.detect(extracted_text)

        return self._finalize(
            detection, source=ScanSource.IMAGE, extracted_text=extracted_text
        )

    # ------------------------------------------------------------------
    # Shared finalization: explanation + persistence + response shape
    # ------------------------------------------------------------------

    def _finalize(
        self,
        detection: DetectionResult,
        source: ScanSource,
        extracted_text: str = None,
    ) -> ScanResponse:
        explanation_result = self.explanation_agent.explain(detection)

        scan_id = generate_id("SCAN")
        timestamp = now_iso()

        signals = [
            f"{hit.category}"
            + (f" — matched \"{hit.excerpt}\"" if hit.excerpt else "")
            + f". {hit.description}"
            for hit in detection.hits
        ]

        detected_signals = [
            DetectedSignal(
                category=hit.category,
                weight=hit.weight,
                excerpt=hit.excerpt,
                description=hit.description,
            )
            for hit in detection.hits
        ]

        response = ScanResponse(
            id=scan_id,
            timestamp=timestamp,
            source=source,
            risk_score=detection.final_risk.score,
            risk_level=detection.final_risk.risk_level,
            rule_score=detection.final_risk.rule_score,
            ml_confidence=detection.final_risk.ml_confidence,
            signals=signals,
            detected_signals=detected_signals,
            rag_context=detection.rag_context,
            ai_explanation=AIExplanation(
                summary=explanation_result.summary,
                detailed_explanation=explanation_result.detailed_explanation,
                recommended_action=explanation_result.recommended_action,
            ),
            explanation=explanation_result.detailed_explanation,
            extracted_text=extracted_text,
        )

        self._store_scan(response, detection)

        return response

    def _store_scan(self, response: ScanResponse, detection: DetectionResult) -> None:
        title = (
            detection.hits[0].category
            if detection.hits
            else "General message analyzed"
        )

        record = {
            "id": response.id,
            "title": title,
            "source": (
                "Screenshot upload"
                if response.source == ScanSource.IMAGE
                else "Pasted message"
            ),
            "timestamp": response.timestamp,
            "risk": response.risk_level.value,
            "score": int(round(response.risk_score)),
        }

        with self._lock:
            self._scans.insert(0, record)
            self._scans = self._scans[:MAX_STORED_SCANS]
            self._save_json(SCANS_FILE, self._scans)

    # ------------------------------------------------------------------
    # Recent incidents (for the dashboard)
    # ------------------------------------------------------------------

    def get_recent_incidents(self, limit: int = 20) -> List[IncidentSummary]:
        with self._lock:
            records = list(self._scans[:limit])

        return [
            IncidentSummary(
                id=record["id"],
                title=record["title"],
                source=record["source"],
                time=humanize_time_ago(record["timestamp"]),
                risk=record["risk"],
                score=record["score"],
            )
            for record in records
        ]

    # ------------------------------------------------------------------
    # I4C reporting
    # ------------------------------------------------------------------

    def report_to_i4c(self, threat_text: str, risk_score: float, reported_by: str) -> str:
        tracking_id = generate_id("I4C")

        record = {
            "tracking_id": tracking_id,
            "threat_text": threat_text,
            "risk_score": risk_score,
            "reported_by": reported_by,
            "timestamp": now_iso(),
        }

        with self._lock:
            self._reports.insert(0, record)
            self._save_json(REPORTS_FILE, self._reports)

        return tracking_id
