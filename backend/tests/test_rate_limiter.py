from app.services.rate_limiter import RATE_LIMIT, check_rate_limit, redis_client


def test_rate_limit_blocks_after_threshold():
    redis_client.delete("ratelimit:test-ip")
    for i in range(RATE_LIMIT):
        allowed, _ = check_rate_limit("test-ip")
        assert allowed, f"request {i+1} should be allowed"
    allowed, retry_after = check_rate_limit("test-ip")
    assert not allowed
    assert retry_after > 0