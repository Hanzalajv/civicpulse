from app.services.triage_cache import (
    get_cached_triage,
    redis_client,
    set_cached_triage,
)


def test_cache_round_trip():
    redis_client.flushdb()
    assert get_cached_triage("hello world text", "loc") is None
    set_cached_triage(
        "hello world text",
        "loc",
        {"category": "water", "priority": "high", "summary": "x", "confidence": 0.9, "triaged_by": "rules"},
    )
    cached = get_cached_triage("hello world text", "loc")
    assert cached is not None
    assert cached["category"] == "water"


def test_cache_key_normalization():
    redis_client.flushdb()
    set_cached_triage(
        "  HELLO World  ",
        "  LOC  ",
        {"category": "water", "priority": "high", "summary": "x", "confidence": 0.9, "triaged_by": "rules"},
    )
    cached = get_cached_triage("hello world", "loc")
    assert cached is not None