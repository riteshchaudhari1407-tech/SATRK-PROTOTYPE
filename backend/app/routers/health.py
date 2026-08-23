"""
GET /api/health — real, honest status of every backend-dependent
service. Never hardcoded, never faked.
"""

from fastapi import APIRouter

from app.container import health_service
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/api/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return health_service.get_health()
