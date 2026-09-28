from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.enums import Category, Priority, Status
from app.models.schemas import ComplaintCreate, ComplaintResponse
from app.repositories.complaint_repo import ComplaintRepository
from app.services.complaint_service import create_complaint
from app.services.rate_limiter import check_rate_limit

router = APIRouter()


def _to_response(complaint) -> ComplaintResponse:
    return ComplaintResponse(
        id=str(complaint.id),
        text=complaint.text,
        location=complaint.location,
        reporter_contact=complaint.reporter_contact,
        category=complaint.category,
        priority=complaint.priority,
        status=complaint.status,
        ai_summary=complaint.ai_summary,
        triaged_by=complaint.triaged_by,
        triage_latency_ms=complaint.triage_latency_ms,
        created_at=complaint.created_at.isoformat(),
        updated_at=complaint.updated_at.isoformat(),
    )


@router.post("/api/complaints", status_code=201, response_model=ComplaintResponse)
def create(
    payload: ComplaintCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    allowed, retry_after = check_rate_limit(client_ip)
    if not allowed:
        response.headers["Retry-After"] = str(retry_after)
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    complaint = create_complaint(db, payload.model_dump())
    return _to_response(complaint)


@router.get("/api/complaints/{complaint_id}", response_model=ComplaintResponse)
def get_one(complaint_id: str, db: Session = Depends(get_db)):
    repo = ComplaintRepository(db)
    complaint = repo.get_by_id(complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return _to_response(complaint)


@router.get("/api/complaints")
def list_all(
    category: Category | None = None,
    priority: Priority | None = None,
    status: Status | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    repo = ComplaintRepository(db)
    rows, total = repo.list(
        category=category,
        priority=priority,
        status=status,
        page=page,
        page_size=page_size,
    )
    return {
        "items": [_to_response(r) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
