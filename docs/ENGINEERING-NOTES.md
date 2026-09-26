I'm building CivicPulse, a municipal complaint intake/triage/ops platform.

Stack:
- Backend: FastAPI + Pydantic v2, Python 3.12-slim, four-layer architecture (routes/services/repositories/providers)
- DB: PostgreSQL 16, Alembic migrations, SQLAlchemy ORM
- Cache: Redis 7, two jobs — 24h triage content-hash cache + 30s stats cache + distributed rate limiter
- AI layer: TriageProvider Protocol with 4 implementations — RuleBasedTriage (fallback), SimulatedTriage (CI), LLMTriage (Groq primary → Gemini secondary chained), factory selected by TRIAGE_PROVIDER env
- Containerization: multi-stage Dockerfile, non-root USER, exec-form CMD, HEALTHCHECK, pinned base
- Compose: compose.dev.yaml with 2 networks (edge + internal:true), 3 volumes (pgdata, redisdata, ollama_models), healthchecks, depends_on: service_healthy
- K8s: kustomize with base + overlays/dev + overlays/prod, StatefulSet for Postgres, HPA v2 on backend, VPA in recommender mode, PDB minAvailable:1, 3 probes (startup/liveness/readiness)
- CI/CD: GitHub Actions — ci.yml (lint, test, build, scan, manifests, integration), cd.yml (test → build-push to GHCR by SHA → deploy to ephemeral k3d), release.yml on tag v*
- Observability: JSON logs to stdout with X-Request-ID propagation, Prometheus /metrics (request count, latency histogram, triage latency, fallback counter)

Write `docs/ENGINEERING-NOTES.md` with answers to Q1–Q4 only. Each answer must:
- Be 150–300 words
- Reference exact files and lines using the format `backend/Dockerfile:2` or `compose.dev.yaml:33-40`
- Give concrete details, not generic theory
- Include the exact line that solves each question where applicable

Q1 — Three things that differ between my laptop and a CI runner, and the exact line in a Dockerfile or manifest that freezes each.

Q2 — Where my pipeline sits on the CI/CD maturity ladder, justify the rung, name the next rung and what it buys.

Q3 — The exact line guaranteeing build-once-deploy-many, and what breaks without it.

Q4 — With a live LLM provider my service is probabilistic. What does "correct" mean for that component, and how did I keep CI deterministic?

For Q4, refer to:
- `backend/app/models/schemas.py` — Pydantic models with Field constraints
- `backend/app/providers/triage/llm.py` — _parse() rejects out-of-enum values, 10s timeout, retry on timeout/429/5xx only
- `backend/app/providers/triage/simulated.py` — deterministic delegate to RuleBasedTriage, with should_fail / should_malform injections
- `backend/tests/test_fallback.py` — asserts provider raises → 201 + triaged_by="rules:fallback"
- `backend/tests/test_injection.py` — asserts category stays in enum regardless of injection attempts
- CI sets TRIAGE_PROVIDER=simulated

Format each Q as a level-2 heading. Use short paragraphs and bullet lists where helpful. Avoid fluff. Avoid "in conclusion". Keep it direct and specific to my repository.