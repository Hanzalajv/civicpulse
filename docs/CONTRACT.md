# CivicPulse API Contract — FROZEN Day 1

## Product
- Name: CivicPulse
- Repo: civicpulse
- Namespace: civicpulse
- DB: civicpulse
- Containers: civicpulse-backend, civicpulse-frontend
- Ports: backend=8000, frontend=80, postgres=5432, redis=6379

## Endpoints
- POST   /api/complaints                → 201 | 400 | 429
- GET    /api/complaints/{id}           → 200 | 404
- GET    /api/complaints                → 200 (filter, paginate)
- PATCH  /api/complaints/{id}/status    → 200 | 409
- GET    /api/stats                     → 200 (X-Cache header)
- GET    /api/meta/providers            → 200
- GET    /health                        → 200
- GET    /ready                         → 200 | 503
- GET    /metrics                       → 200

## Enums
- Category: water, electricity, sanitation, roads, streetlights, other
- Priority: high, normal, low
- Status:   open, in_progress, resolved, rejected

## Field Naming
snake_case

## Complaint Shape
{
  "id": "uuid",
  "text": "string",
  "location": "string",
  "reporter_contact": "string or null",
  "category": "water",
  "priority": "high",
  "status": "open",
  "ai_summary": "string or null",
  "triaged_by": "llm:groq",
  "triage_latency_ms": 1234,
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}

## Request Shape (POST)
{
  "text": "string 10-2000",
  "location": "string 3-200",
  "reporter_contact": "string or null"
}

## Error Shape
{
  "errors": [
    {"field": "text", "message": "must be at least 10 characters"}
  ]
}

## Status Transitions
- open → in_progress ✅
- open → rejected ✅
- in_progress → resolved ✅
- in_progress → rejected ✅
- resolved → anything ❌
- rejected → anything ❌

## X-Cache Values
HIT, MISS

## triaged_by Values
llm:groq, llm:gemini, rules, rules:fallback