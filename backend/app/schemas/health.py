"""
Pydantic schemas for the /api/health endpoint.
"""

from typing import Literal, Optional

from pydantic import BaseModel

ServiceStatusValue = Literal[
    "connected",
    "not_connected",
    "not_configured",
    "checking",
    "error",
]

OverallStatusValue = Literal["healthy", "degraded", "unhealthy"]


class ServiceStatus(BaseModel):
    status: ServiceStatusValue
    configured: Optional[bool] = None
    connected: Optional[bool] = None
    detail: Optional[str] = None
    model: Optional[str] = None


class HealthResponse(BaseModel):
    status: OverallStatusValue
    services: dict[str, ServiceStatus]
