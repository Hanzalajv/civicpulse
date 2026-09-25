import redis
from fastapi import APIRouter, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import text

from app.config import settings
from app.db import engine

router = APIRouter()
redis_client = redis.from_url(settings.redis_url, decode_responses=True)


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/ready")
def ready(response: Response):
    failed: list[str] = []
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        failed.append("postgres")
    try:
        redis_client.ping()
    except Exception:
        failed.append("redis")

    if failed:
        response.status_code = 503
        return {"status": "not_ready", "failed": failed}
    return {"status": "ready"}


@router.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)