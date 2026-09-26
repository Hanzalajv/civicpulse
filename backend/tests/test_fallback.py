from unittest.mock import patch

import pytest

from app.models.enums import Category
from app.providers.triage.simulated import SimulatedTriage
from app.services.complaint_service import create_complaint


@pytest.fixture
def db_session():
    from app.db import SessionLocal
    db = SessionLocal()
    yield db
    db.close()


def test_fallback_on_provider_failure(db_session):
    """Critical test: if provider raises, request still succeeds with rules:fallback."""
    failing_provider = SimulatedTriage(should_fail=True)

    with patch("app.services.complaint_service.get_provider", return_value=failing_provider):
        complaint = create_complaint(
            db_session,
            {
                "text": "burst water main on street 12 flooding the road",
                "location": "street 12 test fallback",
            },
        )

    assert complaint is not None
    assert complaint.triaged_by == "rules:fallback"
    assert complaint.category == Category.water
    assert complaint.ai_summary is not None