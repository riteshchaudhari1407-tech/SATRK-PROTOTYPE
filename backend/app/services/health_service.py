"""
Health Service
----------------
Aggregates the real status of every backend-dependent service
(Groq LLM, semantic AI, OCR) into the shape returned by /api/health.

Groq connectivity is verified with an actual lightweight API call
(not just "is the key present"), but that call is cached for
HEALTH_CACHE_SECONDS so a frontend polling /api/health frequently
doesn't hammer the Groq API on every request.
"""

import time

from app.config import Settings
from app.schemas.health import HealthResponse, ServiceStatus
from app.services.groq_service import GroqService
from app.services.ocr_service import OCRService
from app.services.semantic_service import SemanticService


class HealthService:
    def __init__(
        self,
        settings: Settings,
        groq_service: GroqService,
        semantic_service: SemanticService,
        ocr_service: OCRService,
    ):
        self.settings = settings
        self.groq_service = groq_service
        self.semantic_service = semantic_service
        self.ocr_service = ocr_service

        self._groq_cache: dict = {"result": None, "timestamp": 0.0}
        self._ocr_cache: dict = {"result": None, "timestamp": 0.0}

    def _cached(self, cache: dict, compute_fn) -> dict:
        now = time.time()

        if (
            cache["result"] is None
            or now - cache["timestamp"] > self.settings.HEALTH_CACHE_SECONDS
        ):
            cache["result"] = compute_fn()
            cache["timestamp"] = now

        return cache["result"]

    def _groq_status(self) -> ServiceStatus:
        if not self.groq_service.configured:
            return ServiceStatus(
                status="not_configured",
                configured=False,
                connected=False,
                detail="GROQ_API_KEY is not set in the backend environment.",
            )

        result = self._cached(
            self._groq_cache, self.groq_service.verify_connection
        )

        return ServiceStatus(
            status="connected" if result["connected"] else "error",
            configured=True,
            connected=result["connected"],
            detail=result["detail"],
            model=self.groq_service.model,
        )

    def _semantic_status(self) -> ServiceStatus:
        available = self.semantic_service.available

        return ServiceStatus(
            status="connected" if available else "not_connected",
            configured=True,
            connected=available,
            detail=(
                "Semantic model loaded (all-MiniLM-L6-v2)."
                if available
                else "Semantic model failed to load — check that "
                "sentence-transformers is installed and the model "
                "could be downloaded."
            ),
        )

    def _ocr_status(self) -> ServiceStatus:
        result = self._cached(
            self._ocr_cache, self.ocr_service.check_available
        )

        return ServiceStatus(
            status="connected" if result["connected"] else "not_connected",
            configured=True,
            connected=result["connected"],
            detail=result["detail"],
        )

    def get_health(self) -> HealthResponse:
        groq_status = self._groq_status()
        semantic_status = self._semantic_status()
        ocr_status = self._ocr_status()

        backend_status = ServiceStatus(
            status="connected",
            configured=True,
            connected=True,
            detail="Backend is running.",
        )

        services = {
            "backend": backend_status,
            "groq": groq_status,
            "semantic_ai": semantic_status,
            "ocr": ocr_status,
        }

        ai_engines_up = [
            groq_status.connected,
            semantic_status.connected,
        ]

        if all(ai_engines_up):
            overall = "healthy"
        elif any(ai_engines_up) or ocr_status.connected:
            overall = "degraded"
        else:
            overall = "unhealthy"

        return HealthResponse(status=overall, services=services)
