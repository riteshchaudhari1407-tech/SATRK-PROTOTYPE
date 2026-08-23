"""
Small, dependency-free helper functions shared across services.
"""

import re
import uuid
from datetime import datetime, timezone


def generate_id(prefix: str = "SCAN") -> str:
    """Generate a short, readable unique id, e.g. INC-9F31A2."""
    return f"{prefix}-{uuid.uuid4().hex[:6].upper()}"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def clean_text(text: str) -> str:
    """Normalize whitespace without destroying casing (regex matching
    is case-insensitive already, so we keep original casing for
    excerpt display)."""
    return re.sub(r"\s+", " ", text or "").strip()


def humanize_time_ago(iso_timestamp: str) -> str:
    """Turn an ISO timestamp into a short 'x min ago' style string."""
    try:
        then = datetime.fromisoformat(iso_timestamp)
    except ValueError:
        return "just now"

    if then.tzinfo is None:
        then = then.replace(tzinfo=timezone.utc)

    delta = datetime.now(timezone.utc) - then
    seconds = int(delta.total_seconds())

    if seconds < 60:
        return "just now"
    if seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} min ago"
    if seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hr ago"

    days = seconds // 86400
    return f"{days} day{'s' if days > 1 else ''} ago"


def extract_excerpt(text: str, match: "re.Match", padding: int = 18) -> str:
    """Pull a short readable snippet of context around a regex match,
    so a detected signal can cite the actual phrase that triggered it
    rather than a generic category label."""
    if match is None:
        return ""

    start = max(0, match.start() - padding)
    end = min(len(text), match.end() + padding)

    excerpt = text[start:end].strip()

    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(text) else ""

    return f"{prefix}{excerpt}{suffix}"


def clamp(value: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, value))
