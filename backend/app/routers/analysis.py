"""
POST /api/analyze        — analyze a pasted text message
POST /api/analyze-image  — OCR a screenshot, then analyze the extracted text

Both return an AnalysisResponse produced entirely by the backend's
hybrid AI pipeline (analysis_service). The frontend never generates
any part of this result — it only displays it.
"""

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.container import analysis_service, settings
from app.routers.scans import record_scan
from app.schemas.analysis import AnalysisResponse, AnalyzeTextRequest

logger = logging.getLogger("satrk.router.analysis")

router = APIRouter()


@router.post("/api/analyze", response_model=AnalysisResponse, operation_id="analyze_text_main")
@router.post("/api/v1/scan-text", response_model=AnalysisResponse, operation_id="analyze_text_alias")
@router.post("/api/v1/scan", response_model=AnalysisResponse, operation_id="analyze_text_legacy")
def analyze_text(payload: AnalyzeTextRequest) -> AnalysisResponse:
    try:
        res = analysis_service.analyze_text(payload.text)
        if res.success and res.risk_score is not None:
            record_scan(
                message=payload.text,
                risk_score=res.risk_score,
                risk_level=res.risk_level or "LOW",
                scam_category=res.scam_category,
            )
        return res
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error during text analysis")
        raise HTTPException(
            status_code=500, detail=f"Analysis failed unexpectedly: {exc}"
        ) from exc


@router.post("/api/analyze-image", response_model=AnalysisResponse, operation_id="analyze_image_main")
@router.post("/api/v1/scan-image", response_model=AnalysisResponse, operation_id="analyze_image_alias")
@router.post("/api/v1/scan/image", response_model=AnalysisResponse, operation_id="analyze_image_legacy")
async def analyze_image(file: UploadFile = File(...)) -> AnalysisResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400, detail="Please upload a valid image file."
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image exceeds the {settings.MAX_IMAGE_SIZE_MB}MB limit.",
        )

    try:
        res = analysis_service.analyze_image(image_bytes)
        if res.success and res.risk_score is not None:
            record_scan(
                message=res.extracted_text or "Screenshot OCR Analysis",
                risk_score=res.risk_score,
                risk_level=res.risk_level or "LOW",
                scam_category=res.scam_category,
            )
        return res
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error during image analysis")
        raise HTTPException(
            status_code=500, detail=f"Analysis failed unexpectedly: {exc}"
        ) from exc
