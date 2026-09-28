import signal
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db import engine
from app.logging_config import RequestIdMiddleware, configure_logging
from app.routes import complaints, health, meta, stats, status
from app.services.stats_service import redis_client as stats_redis

configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    stats_redis.close()
    engine.dispose()


app = FastAPI(title="CivicPulse API", lifespan=lifespan)

app.add_middleware(RequestIdMiddleware)

app.include_router(health.router)
app.include_router(complaints.router)
app.include_router(status.router)
app.include_router(stats.router)
app.include_router(meta.router)


def _handle_sigterm(signum, frame):
    sys.exit(0)


signal.signal(signal.SIGTERM, _handle_sigterm)
