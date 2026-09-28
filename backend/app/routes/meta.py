from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/api/meta/providers")
def meta():
    return {
        "active_provider": settings.triage_provider,
        "last_outcomes": [],
    }
