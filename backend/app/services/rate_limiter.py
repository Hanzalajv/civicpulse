import redis

from app.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)

RATE_LIMIT = 10  # requests
RATE_WINDOW = 60  # seconds


def check_rate_limit(client_ip: str) -> tuple[bool, int]:
    key = f"ratelimit:{client_ip}"
    current = redis_client.incr(key)
    if current == 1:
        redis_client.expire(key, RATE_WINDOW)

    if current > RATE_LIMIT:
        ttl = redis_client.ttl(key)
        return False, max(ttl, 0)

    return True, 0
