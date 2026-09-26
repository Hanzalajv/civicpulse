from app.db import SessionLocal
from app.services.stats_service import STATS_CACHE_KEY, get_stats, invalidate_stats, redis_client


def test_stats_miss_then_hit_then_invalidate():
    redis_client.delete(STATS_CACHE_KEY)
    db = SessionLocal()
    try:
        _, first = get_stats(db)
        assert first == "MISS"

        _, second = get_stats(db)
        assert second == "HIT"

        invalidate_stats()

        _, third = get_stats(db)
        assert third == "MISS"
    finally:
        db.close()