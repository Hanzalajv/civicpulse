import hashlib
import json

import redis

from app.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)

TRIAGE_CACHE_TTL = 86400  # 24 hours


def _cache_key(text: str, location: str) -> str:
    raw = f"{text.strip().lower()}|{location.strip().lower()}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"triage:{digest}"


def get_cached_triage(text: str, location: str) -> dict | None:
    data = redis_client.get(_cache_key(text, location))
    if data is None:
        return None
    return json.loads(data)


def set_cached_triage(text: str, location: str, result: dict) -> None:
    redis_client.setex(
        _cache_key(text, location),
        TRIAGE_CACHE_TTL,
        json.dumps(result),
    )