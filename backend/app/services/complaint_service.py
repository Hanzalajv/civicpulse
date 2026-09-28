import logging
import time

from sqlalchemy.orm import Session

from app.metrics import TRIAGE_FALLBACK_COUNT, TRIAGE_LATENCY
from app.models.enums import Status
from app.models.orm import Complaint
from app.providers.triage.factory import get_provider
from app.providers.triage.rules import RuleBasedTriage
from app.repositories.complaint_repo import ComplaintRepository
from app.services.stats_service import invalidate_stats
from app.services.triage_cache import get_cached_triage, set_cached_triage

logger = logging.getLogger(__name__)


def _resolve_provider_name(provider) -> str:
    if provider.name == "llm":
        primary = getattr(provider, "primary", "groq")
        return f"llm:{primary}"
    return provider.name


def create_complaint(db: Session, data: dict) -> Complaint:
    text = data["text"]
    location = data["location"]

    cached = get_cached_triage(text, location)
    if cached is not None:
        triage = cached
        triaged_by = cached["triaged_by"]
        latency_ms = 0
    else:
        provider = get_provider()
        started = time.perf_counter()
        try:
            result = provider.triage(text, location)
            triaged_by = _resolve_provider_name(provider)
        except Exception as exc:
            logger.warning(
                "Triage provider failed, falling back to rules",
                extra={
                    "provider": provider.name,
                    "error_class": type(exc).__name__,
                    "error_message": str(exc)[:300],
                    "location": location,
                },
            )
            result = RuleBasedTriage().triage(text, location)
            triaged_by = "rules:fallback"
            TRIAGE_FALLBACK_COUNT.inc()
        latency_ms = int((time.perf_counter() - started) * 1000)
        TRIAGE_LATENCY.labels(provider=triaged_by).observe(latency_ms / 1000.0)

        triage = {
            "category": result.category.value,
            "priority": result.priority.value,
            "summary": result.summary,
            "confidence": result.confidence,
            "triaged_by": triaged_by,
        }
        set_cached_triage(text, location, triage)

    repo = ComplaintRepository(db)
    complaint = repo.create(
        {
            "text": text,
            "location": location,
            "reporter_contact": data.get("reporter_contact"),
            "category": triage["category"],
            "priority": triage["priority"],
            "status": Status.open,
            "ai_summary": triage["summary"],
            "triaged_by": triaged_by,
            "triage_latency_ms": latency_ms,
        }
    )
    invalidate_stats()
    return complaint


def update_status(db: Session, complaint_id: str, new_status: Status) -> Complaint:
    from app.services.state_machine import can_transition

    repo = ComplaintRepository(db)
    complaint = repo.get_by_id(complaint_id)
    if complaint is None:
        raise ValueError("not_found")
    if not can_transition(complaint.status, new_status):
        raise ValueError(f"invalid_transition:{complaint.status.value}->{new_status.value}")

    updated = repo.update_status(complaint_id, new_status)
    invalidate_stats()
    return updated
