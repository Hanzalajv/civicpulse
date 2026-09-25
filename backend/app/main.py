from fastapi import FastAPI

from app.routes import complaints, health, meta, stats, status

app = FastAPI(title="CivicPulse API")

app.include_router(health.router)
app.include_router(complaints.router)
app.include_router(status.router)
app.include_router(stats.router)
app.include_router(meta.router)