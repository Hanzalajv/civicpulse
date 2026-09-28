import json

import redis
from sqlalchemy.orm import Session

from app.config import settings
from app.repositories.complaint_repo import ComplaintRepository

redis_client = redis.from_url(settings.redis_url, decode_responses=True)

STATS_CACHE_KEY = "stats:aggregates"
STATS_TTL = 30  # seconds


def get_stats(db: Session) -> tuple[dict, str]:
    cached = redis_client.get(STATS_CACHE_KEY)
    if cached is not None:
        return json.loads(cached), "HIT"

    repo = ComplaintRepository(db)
    stats = repo.stats()
    redis_client.setex(STATS_CACHE_KEY, STATS_TTL, json.dumps(stats))
    return stats, "MISS"


def invalidate_stats() -> None:
    redis_client.delete(STATS_CACHE_KEY)
