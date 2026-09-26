# Hanzala's Backend Progress

> Backend + Redis + DB workstream for CivicPulse.
> Branch: `backend/hanzala`
> Owner: Hanzala
> Last updated: 2026-09-25

---

## What Is Done

### Phase 0 — Foundation
- [x] GitHub repo created and cloned
- [x] Remote `origin` set to `https://github.com/Hanzalajv/civicpulse`
- [x] Branch strategy: `main` (protected) → `dev` (integration) → `backend/hanzala` (work)
- [x] `.gitignore` includes `.env`, `__pycache__`, `*.pyc`, `node_modules`, `.venv`
- [x] `.env.example` committed; `.env` local only (gitignored)
- [x] `docs/CONTRACT.md` — frozen API contract with partner
- [x] `README.md` skeleton

### Phase 1 — Backend Core (Hanzala)

#### Config & Models
- [x] `backend/app/config.py` — Pydantic BaseSettings reading env vars
- [x] `backend/app/models/enums.py` — `Category`, `Priority`, `Status`
- [x] `backend/app/models/schemas.py` — `TriageResult`, `ComplaintCreate`, `ComplaintResponse`, `FieldError`, `ErrorResponse`
- [x] `backend/app/models/orm.py` — `Complaint` SQLAlchemy model with UUID PK, CHECK constraints on `text` (10–2000) and `location` (3–200), indexes on `(status, priority)` and `created_at`

#### Database
- [x] `backend/app/db.py` — SQLAlchemy engine + session factory
- [x] `backend/alembic.ini` — Alembic config
- [x] `backend/alembic/env.py` — reads `DATABASE_URL` from settings
- [x] Migration generated: `d70ab962bcd2_create_complaints_table.py`
- [x] Migration applied — table + indexes + constraints verified via `\d complaints`

#### Repository
- [x] `backend/app/repositories/complaint_repo.py`
  - `create(data)`
  - `get_by_id(id)`
  - `list(category, priority, status, page, page_size)`
  - `update_status(id, new_status)`
  - `stats()` — by category and by priority

#### Triage Providers
- [x] `backend/app/providers/triage/base.py` — `TriageProvider` Protocol
- [x] `backend/app/providers/triage/rules.py` — keyword-based `RuleBasedTriage`
- [x] `backend/app/providers/triage/simulated.py` — deterministic fake with failure injection; delegates to rules for realistic output
- [x] `backend/app/providers/triage/llm.py` — `LLMTriage` with Groq primary + Gemini secondary chained, JSON mode + Pydantic validation, 10s timeout, retry once with jitter on timeout/429/5xx, prompt-injection guardrail, never logs API keys
- [x] `backend/app/providers/triage/factory.py` — reads `TRIAGE_PROVIDER` env

#### Services
- [x] `backend/app/services/triage_cache.py` — Redis content-hash cache, 24h TTL
- [x] `backend/app/services/stats_service.py` — Redis stats cache, 30s TTL, invalidate on write
- [x] `backend/app/services/rate_limiter.py` — Redis fixed-window, keyed by IP, 429 + Retry-After
- [x] `backend/app/services/state_machine.py` — explicit transition table
- [x] `backend/app/services/complaint_service.py` — orchestrates validate → cache → triage → fallback → persist → invalidate stats

#### Routes (all 10 endpoints)
- [x] `backend/app/routes/health.py` — `/health`, `/ready`, `/metrics`
- [x] `backend/app/routes/complaints.py` — `POST /api/complaints`, `GET /api/complaints/{id}`, `GET /api/complaints`
- [x] `backend/app/routes/status.py` — `PATCH /api/complaints/{id}/status` with 409 on invalid transition
- [x] `backend/app/routes/stats.py` — `GET /api/stats` with `X-Cache` header
- [x] `backend/app/routes/meta.py` — `GET /api/meta/providers`
- [x] `backend/app/main.py` — wired all routers

#### Scripts
- [x] `backend/scripts/seed.py` — 30 realistic complaints across all categories, idempotent

#### Docker
- [x] `backend/Dockerfile` — multi-stage, non-root, exec CMD, HEALTHCHECK
- [x] `backend/.dockerignore`
- [x] `backend/requirements.txt` — for fast cached builds
- [x] `compose.dev.yaml` — 3 services (postgres, redis, backend), 2 networks, 2 volumes, healthchecks, `depends_on: service_healthy`

---

## Verified Working

### Direct Provider Tests
SimulatedTriage().triage('burst water main on street 12', 'street 12')
→ category=water priority=high confidence=0.6

SimulatedTriage(should_fail=True).triage('x', 'y')
→ RuntimeError: simulated provider failure

text

### Service Tests
get_cached_triage / set_cached_triage → round-trip works
get_stats → MISS → HIT → after invalidate → MISS
check_rate_limit('1.2.3.4') x12 → 10 allowed, 11th blocked with TTL
can_transition(open, in_progress) → True
can_transition(open, resolved) → False
can_transition(resolved, open) → False

text

### Full Endpoint Smoke Test (`scripts/test-endpoints.ps1`)
GET /health → 200 ok
GET /ready → 200 ready
POST /api/complaints → 201 water/high/simulated
GET /api/complaints/{id} → 200 correct data
GET /api/complaints?page=1&page_size=5 → 200 paginated
PATCH /api/complaints/{id}/status (valid) → 200 in_progress
PATCH /api/complaints/{id}/status (invalid) → 409 invalid transition
GET /api/stats → X-Cache MISS then HIT
GET /api/meta/providers → active_provider=simulated
POST /api/complaints x11 → 201 x10, 429 on 11th

text

### Seed
python -m scripts.seed
→ Seeded: 30 inserted, 0 skipped
python -m scripts.seed (again)
→ Seeded: 0 inserted, 30 skipped

text

---

## One Command to Run

```powershell
docker compose -f compose.dev.yaml up -d
Starts:

civicpulse-postgres-1 (healthy)

civicpulse-redis-1 (healthy)

civicpulse-backend-1 (running)

Environment
Variable	Value (local .env)
POSTGRES_USER	civicpulse
POSTGRES_PASSWORD	civicpulse_dev
POSTGRES_DB	civicpulse
DATABASE_URL	postgresql+psycopg://civicpulse:civicpulse_dev@postgres:5432/civicpulse
REDIS_URL	redis://redis:6379/0
TRIAGE_PROVIDER	simulated
GROQ_API_KEY	(empty — add before demo)
GEMINI_API_KEY	(empty — add before demo)
File Tree
text
backend/
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── d70ab962bcd2_create_complaints_table.py
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── db.py
│   ├── main.py
│   ├── models/
│   │   ├── enums.py
│   │   ├── orm.py
│   │   └── schemas.py
│   ├── providers/
│   │   └── triage/
│   │       ├── base.py
│   │       ├── factory.py
│   │       ├── llm.py
│   │       ├── rules.py
│   │       └── simulated.py
│   ├── repositories/
│   │   └── complaint_repo.py
│   ├── routes/
│   │   ├── complaints.py
│   │   ├── health.py
│   │   ├── meta.py
│   │   ├── stats.py
│   │   └── status.py
│   └── services/
│       ├── complaint_service.py
│       ├── rate_limiter.py
│       ├── state_machine.py
│       ├── stats_service.py
│       └── triage_cache.py
├── scripts/
│   └── seed.py
├── tests/
│   └── __init__.py
├── .dockerignore
├── Dockerfile
├── alembic.ini
├── pyproject.toml
└── requirements.txt
compose.dev.yaml
docs/
├── CONTRACT.md
└── hanzala.md
scripts/
└── test-endpoints.ps1
What's Left
Backend (Hanzala)
□ Step 1.26 — Graceful shutdown (SIGTERM handling)
□ Step 1.27 — JSON logging with X-Request-ID propagation
□ Step 1.28 — Prometheus counters (request count, latency histogram, triage latency, fallback counter)
□ Step 1.29 — Backend tests (≥65% coverage)
□ test_fallback.py — critical: provider raises → 201 + triaged_by="rules:fallback"
□ test_injection.py — prompt injection → schema-compliant
□ test_state_machine.py
□ test_rate_limiter.py
□ test_routes_*.py
□ test_seed_idempotent.py
□ Step 1.30 — Docker compose down/up persistence verification
□ Step 1.31 — Commit, push, open PR to dev
Handoff to Partner (Frontend + Docker/K8s/CI)
□ Add frontend service to compose.yaml
□ Wire frontend to backend:8000 via nginx /api proxy
□ Add K8s manifests for backend, postgres, redis
□ Add CI jobs for backend tests
□ Full compose + K8s integration test
Notes
TRIAGE_PROVIDER=simulated for now. Switch to llm before demo (needs Groq + Gemini keys in .env).

Redis cache is cleared with docker compose exec redis redis-cli FLUSHDB when provider behavior changes.

Rate limit is 10 requests per 60 seconds per IP (dev).

Triage cache TTL: 24 hours.

Stats cache TTL: 30 seconds, invalidated on every complaint write.

Fallback: LLM → Gemini → RuleBasedTriage → triaged_by="rules:fallback".

---

## Polish Completed (Phase 1.26–1.30)

- [x] Graceful shutdown via FastAPI lifespan + SIGTERM handler
- [x] JSON logging with `X-Request-ID` propagated to every log line
- [x] Prometheus metrics: `http_requests_total`, `http_request_duration_seconds`, `triage_duration_seconds`, `triage_fallback_total`
- [x] Backend tests: 31 passing
  - `test_providers.py` — rules, simulated, factory
  - `test_state_machine.py` — all transitions
  - `test_rate_limiter.py` — threshold blocks
  - `test_triage_cache.py` — round-trip + normalization
  - `test_routes.py` — all endpoints
  - `test_fallback.py` — **critical test passes**
  - `test_injection.py` — prompt injection still enum-compliant
- [x] Docker persistence verified: `down` + `up` preserves rows

## Test Output
31 passed, 0 failed
Coverage: ≥65%


## Fixes Applied

- `conftest.py` — guard empty `redis_client.delete(*keys)` with `if keys:`
- `rules.py` — reordered keyword dict so `streetlights` matches before `roads`; removed ambiguous `"light"` keyword

## Evidence

- `docs/evidence/persistence-after-down-up.txt` — row count preserved across restart