from app.db import SessionLocal
from app.models.orm import Complaint
from scripts.seed import SEED_COMPLAINTS, seed


def test_seed_is_idempotent():
    # Record the row count after one seed run
    seed()

    db = SessionLocal()
    try:
        count_after_first = db.query(Complaint).count()
    finally:
        db.close()

    # Run again — should insert nothing
    seed()

    db = SessionLocal()
    try:
        count_after_second = db.query(Complaint).count()
    finally:
        db.close()

    assert count_after_first == count_after_second, (
        f"Seed is not idempotent: {count_after_first} -> {count_after_second}"
    )


def test_seed_creates_all_rows():
    seed()

    db = SessionLocal()
    try:
        for item in SEED_COMPLAINTS:
            exists = (
                db.query(Complaint)
                .filter(Complaint.text == item["text"])
                .filter(Complaint.location == item["location"])
                .first()
            )
            assert exists is not None, f"Missing seeded row: {item['text']}"
    finally:
        db.close()