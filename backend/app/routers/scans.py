"""
Scans & Incidents Router
------------------------
GET  /api/v1/scans/recent -> list recent scans for dashboard/incidents view
POST /api/v1/i4c/report    -> dispatch incident report to I4C portal gateway
"""

from datetime import datetime
import logging
import random
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

logger = logging.getLogger("satrk.router.scans")

router = APIRouter()

# In-memory store for recent scan incidents
_recent_scans = [
    {
        "id": "INC-4821",
        "title": "Authority impersonation pattern detected",
        "source": "WhatsApp message",
        "time": "2 min ago",
        "risk": "CRITICAL",
        "score": 96,
    },
    {
        "id": "INC-4820",
        "title": "Coercive link & immediate money transfer demand",
        "source": "SMS alert",
        "time": "15 min ago",
        "risk": "HIGH",
        "score": 75,
    },
]

_counter = 4822


def record_scan(message: str, risk_score: int, risk_level: str, scam_category: Optional[str] = None):
    global _counter
    inc_id = f"INC-{_counter}"
    _counter += 1

    title = scam_category or "Threat Pattern Detected"
    if message:
        clean_msg = message.strip()
        if len(clean_msg) > 50:
            title = clean_msg[:47] + "..."
        else:
            title = clean_msg

    scan_item = {
        "id": inc_id,
        "title": title,
        "source": "Text / Screenshot Input",
        "time": "Just now",
        "risk": risk_level.upper() if risk_level else ("CRITICAL" if risk_score >= 70 else "LOW"),
        "score": risk_score,
    }
    _recent_scans.insert(0, scan_item)
    if len(_recent_scans) > 20:
        _recent_scans.pop()


class I4CReportRequest(BaseModel):
    threat_text: str
    risk_score: int
    reported_by: str = "Anonymous Victim"


@router.get("/api/v1/scans/recent")
def get_recent_scans() -> List[dict]:
    return _recent_scans


@router.post("/api/v1/i4c/report")
def report_to_i4c(payload: I4CReportRequest):
    tracking_id = f"I4C-DEL-2026-{random.randint(100000, 999999)}"
    logger.info("Reporting threat to I4C portal, tracking_id=%s, reported_by=%s", tracking_id, payload.reported_by)
    return {
        "status": "success",
        "i4c_tracking_id": tracking_id,
        "message": "Threat successfully recorded and dispatched to I4C portal.",
        "forwarded_data": {
            "risk_score": payload.risk_score,
            "reported_by": payload.reported_by,
            "gateway": "secure-api.cybercrime.gov.in",
        },
    }
