from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.enums import Status
from app.services.complaint_service import update_status
from app.routes.complaints import _to_response

router = APIRouter()


class StatusUpdate(BaseModel):
    status: Status


@router.patch("/api/complaints/{complaint_id}/status")
def patch_status(complaint_id: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    try:
        complaint = update_status(db, complaint_id, payload.status)
    except ValueError as e:
        message = str(e)
        if message == "not_found":
            raise HTTPException(status_code=404, detail="Complaint not found")
        if message.startswith("invalid_transition:"):
            transition = message.split(":", 1)[1]
            raise HTTPException(
                status_code=409,
                detail=f"Invalid status transition: {transition}",
            )
        raise HTTPException(status_code=400, detail=message)
    return _to_response(complaint)