from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.stats_service import get_stats

router = APIRouter()


@router.get("/api/stats")
def stats(response: Response, db: Session = Depends(get_db)):
    data, cache_status = get_stats(db)
    response.headers["X-Cache"] = cache_status
    return data