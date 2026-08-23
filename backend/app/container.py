"""
Service container.

All services are instantiated exactly once at process startup
(module-level singletons) — the ML/embedding model loads once, the
Groq client is created once, etc. Routers import instances from here
rather than constructing their own.
"""

import logging

from app.config import get_settings
from app.services.analysis_service import AnalysisService
from app.services.groq_service import GroqService
from app.services.health_service import HealthService
from app.services.ocr_service import OCRService
from app.services.semantic_service import SemanticService

logger = logging.getLogger("satrk.container")

settings = get_settings()

logger.info("Initializing Satrk services...")

groq_service = GroqService(settings)
semantic_service = SemanticService()
ocr_service = OCRService()

analysis_service = AnalysisService(
    groq_service=groq_service,
    semantic_service=semantic_service,
    ocr_service=ocr_service,
)

health_service = HealthService(
    settings=settings,
    groq_service=groq_service,
    semantic_service=semantic_service,
    ocr_service=ocr_service,
)

logger.info(
    "Services ready — groq_configured=%s semantic_available=%s ocr_available=%s",
    groq_service.configured,
    semantic_service.available,
    ocr_service.available,
)
