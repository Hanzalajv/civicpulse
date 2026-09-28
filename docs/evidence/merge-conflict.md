# Merge Conflict — Resolution Evidence

## What Conflicted

- **File:** `backend/tests/test_seed_idempotent.py`
- **Branch A:** `dev` (Sawaira-Fareed's version — added `seed()` at the top)
- **Branch B:** `fix/ruff-lint` (Hanzala's branch — original test without the extra `seed()`)
- **When:** After pulling `dev` into `fix/ruff-lint`, the extra `seed()` in the test conflicted with the branch's original version

## Version A (dev — Winner)

```python
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


    Version B (fix/ruff-lint — pre-merge)
python
def test_seed_is_idempotent():
    db = SessionLocal()
    try:
        before = db.query(Complaint).count()
    finally:
        db.close()

    seed()
    seed()

    db = SessionLocal()
    try:
        after = db.query(Complaint).count()
    finally:
        db.close()

    assert after == before
Resolution
Kept Version A — the dev version with the extra seed() at the top.

Why Version A Won
Version A actually tests idempotency. The original version assumed the test DB starts empty — but in CI, other tests run first and insert rows. So before = 3, seed inserts 30 more, after = 33, and assert after == before fails.

Version A calls seed() first so before already includes any pre-existing rows. Then calls seed() again — idempotency means the second call must not change the count. assert after == before passes.

The test now measures what it's supposed to: running seed twice does not duplicate rows.

Commands Run
bash
git checkout dev
git pull origin dev
git checkout -b fix/ruff-lint
git merge origin/dev
# CONFLICT (content): Merge conflict in backend/tests/test_seed_idempotent.py
# Opened file, saw <<<<<<< / ======= / >>>>>>> markers, kept Version A
git add backend/tests/test_seed_idempotent.py
Screenshot
See docs/evidence/merge_evidence.png for the conflict markers captured before resolution.