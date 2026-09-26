from unittest.mock import patch

from fastapi.testclient import TestClient


def test_ready_returns_503_when_redis_down():
    from app.main import app

    with patch("app.routes.health.redis_client.ping", side_effect=Exception("redis down")):
        with TestClient(app) as client:
            r = client.get("/ready")
            assert r.status_code == 503
            assert "redis" in r.json()["failed"]