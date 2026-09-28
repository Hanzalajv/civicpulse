# LLM Path Verification

## Test 1 — Groq Primary (direct)

LLMTriage()._call_groq("burst water main on street 12", "street 12")
→ category=water priority=high
summary="Burst water main on street 12 causing potential flooding."
confidence=0.99

## Test 2 — Gemini Secondary (direct)
LLMTriage()._call_gemini("burst water main on street 12", "street 12")
→ category=water priority=high
summary="Burst water main reported on street 12."
confidence=0.98


## Test 3 — Groq via Full API

- Config: `TRIAGE_PROVIDER=llm`, valid Groq key
- POST `"Burst water main flooding Street 12 since morning..."` → `Street 12`
- Result:
  - `triaged_by: llm:groq`
  - `triage_latency_ms: 883`
  - `ai_summary: "Burst water main flooding Street 12, water entering ground floors."`

## Test 4 — Gemini via Full API

- Config: `GROQ_API_KEY=invalid`, `GEMINI_API_KEY=<real>`
- Container fully recreated (`down` + `up -d`)
- Result:
  - `triaged_by: llm:gemini`
  - Backend log: `POST .../gemini-2.5-flash:generateContent → 200 OK`

## Test 5 — Full Fallback via API

- Config: both keys invalid
- POST → `status: 201`, `triaged_by: rules:fallback`

## Test 6 — Cache Hit

- Duplicate POST of same text+location → `triage_latency_ms: 0`

## Models Used

- Groq: `openai/gpt-oss-20b`
- Gemini: `gemini-2.5-flash`

## Conclusion

Real LLM triage works. Fallback chain survives provider failure. User never sees a 500.