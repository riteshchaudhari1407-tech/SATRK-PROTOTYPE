"""
Pydantic request models for incoming API payloads.
"""

from pydantic import BaseModel, Field


class TextScanRequest(BaseModel):
    threat_text: str = Field(
        ...,
        min_length=1,
        description="The suspicious message pasted by the user (SMS, WhatsApp, email, chat).",
    )


class I4CReportRequest(BaseModel):
    threat_text: str = Field(default="Screenshot evidence analyzed")
    risk_score: float = Field(default=0)
    reported_by: str = Field(default="Analyst")
