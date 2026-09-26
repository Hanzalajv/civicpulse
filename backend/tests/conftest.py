import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("TRIAGE_PROVIDER", "simulated")
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://civicpulse:civicpulse_dev@postgres:5432/civicpulse",
)
os.environ.setdefault("REDIS_URL", "redis://redis:6379/0")


@pytest.fixture(scope="session")
def client():
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def clear_rate_limit():
    from app.services.rate_limiter import redis_client

    keys = redis_client.keys("ratelimit:*")
    if keys:
        redis_client.delete(*keys)
    yield