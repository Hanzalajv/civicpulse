from app.db import SessionLocal
from app.models.orm import Complaint
from scripts.seed import seed


def test_seed_is_idempotent():
    seed()
    db = SessionLocal()
    try:
        before = db.query(Complaint).count()
    finally:
        db.close()

    seed()

    db = SessionLocal()
    try:
        after = db.query(Complaint).count()
    finally:
        db.close()

    assert after == before