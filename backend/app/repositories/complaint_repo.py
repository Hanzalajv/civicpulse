from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.enums import Category, Priority, Status
from app.models.orm import Complaint


class ComplaintRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> Complaint:
        complaint = Complaint(**data)
        self.db.add(complaint)
        self.db.commit()
        self.db.refresh(complaint)
        return complaint

    def get_by_id(self, complaint_id: str) -> Complaint | None:
        return (
            self.db.query(Complaint)
            .filter(Complaint.id == complaint_id)
            .first()
        )

    def list(
        self,
        category: Category | None = None,
        priority: Priority | None = None,
        status: Status | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Complaint], int]:
        query = self.db.query(Complaint)
        if category:
            query = query.filter(Complaint.category == category)
        if priority:
            query = query.filter(Complaint.priority == priority)
        if status:
            query = query.filter(Complaint.status == status)

        total = query.count()
        rows = (
            query.order_by(Complaint.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return rows, total

    def update_status(self, complaint_id: str, new_status: Status) -> Complaint:
        complaint = self.get_by_id(complaint_id)
        complaint.status = new_status
        self.db.commit()
        self.db.refresh(complaint)
        return complaint

    def stats(self) -> dict:
        by_category = dict(
            self.db.query(Complaint.category, func.count(Complaint.id))
            .group_by(Complaint.category)
            .all()
        )
        by_priority = dict(
            self.db.query(Complaint.priority, func.count(Complaint.id))
            .group_by(Complaint.priority)
            .all()
        )
        return {
            "by_category": {k.value: v for k, v in by_category.items()},
            "by_priority": {k.value: v for k, v in by_priority.items()},
            "total": sum(by_category.values()),
        }