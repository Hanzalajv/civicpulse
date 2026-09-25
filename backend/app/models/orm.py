import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Enum as SQLEnum,
    Index,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

from .enums import Category, Priority, Status

Base = declarative_base()


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(String(2000), nullable=False)
    location = Column(String(200), nullable=False)
    reporter_contact = Column(String(200), nullable=True)
    category = Column(SQLEnum(Category), nullable=False)
    priority = Column(SQLEnum(Priority), nullable=False)
    status = Column(SQLEnum(Status), nullable=False, default=Status.open)
    ai_summary = Column(String(140), nullable=True)
    triaged_by = Column(String(50), nullable=False)
    triage_latency_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "char_length(text) >= 10 AND char_length(text) <= 2000",
            name="text_length",
        ),
        CheckConstraint(
            "char_length(location) >= 3 AND char_length(location) <= 200",
            name="location_length",
        ),
        Index("ix_status_priority", "status", "priority"),
        Index("ix_created_at", "created_at"),
    )