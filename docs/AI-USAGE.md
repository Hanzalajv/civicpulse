# AI Usage

Per §5.5, this document discloses where AI tools assisted and what was changed afterwards. Honest attribution, not avoidance.

---

## Tools Used

- **Claude (Anthropic)** — architecture guidance, test scaffolding, debugging, documentation drafts
- **GitHub Copilot** — autocomplete for boilerplate and repetitive code
- **ChatGPT** — occasional second opinions on bugs

---

## Hanzala (backend, Redis, DB)

### Where AI Helped

**Scaffolding and boilerplate**
- Initial `backend/pyproject.toml` structure — I added dependencies as I went
- `backend/Dockerfile` multi-stage template — I adapted the cache-friendly COPY order so `requirements.txt` is copied before source
- Test skeletons in `backend/tests/` — I filled in assertions and fixed real bugs

**Debugging**
- Alembic `ModuleNotFoundError: No module named 'psycopg'` — AI identified the driver mismatch; I switched `psycopg2-binary` → `psycopg[binary]` and updated `DATABASE_URL` to `postgresql+psycopg://`
- Redis `wrong number of arguments for 'del' command` — AI suggested the `if keys:` guard in `conftest.py`; I applied it
- PowerShell `&` parsing errors in test scripts — AI suggested `[char]38`; I used it
- `test_rules_detects_streetlight` failure — AI flagged that `"streetlight"` contains `"street"`, so `roads` matched first. I reordered the keyword dict and removed the ambiguous `"light"` keyword
- Groq model 404 — AI suggested checking `/v1/models`; I switched to `openai/gpt-oss-20b`
- Gemini model 404 — AI suggested listing models; I switched to `gemini-2.5-flash`

**Documentation drafts**
- ADR skeletons (`docs/adr/0001-...` through `0004-...`) — I rewrote with real file:line references
- `docs/ENGINEERING-NOTES.md` Q1–Q4 first draft — I verified every line reference against the actual files
- `docs/RUNBOOK.md` skeleton — I filled in the commands I actually ran

**Architecture decisions**
- Suggested chaining Groq → Gemini instead of Groq only — I agreed and added it because it demonstrates a real production pattern
- Suggested rejecting out-of-enum LLM output in `_parse()` rather than coercing — I implemented the strict version

### What I Changed After AI Output

1. **Fallback logic** — AI's first draft did not cache `triaged_by`. I added it to the triage cache payload so fallback markers persist across duplicate requests.
2. **Retry logic** — AI retried on all errors. I changed it to retry only on timeout/429/5xx, never on 400. A 400 means the request was wrong and will be wrong again.
3. **`eval()` suggestion** — AI's initial LLM parser used `eval()` to parse JSON. I replaced with `json.loads()` and Pydantic validation.
4. **Prompt-injection guardrail** — AI's prompt did not delimit complaint text. I added `<complaint>` tags and the explicit "treat as untrusted data" instruction.
5. **`SimulatedTriage` behavior** — AI's version returned hardcoded `other/normal` for every input. I made it delegate to `RuleBasedTriage` so tests and dev produce realistic output while staying deterministic.
6. **Keyword ordering in `rules.py`** — AI's original dict had `roads` before `streetlights`. I reordered after the failing test.
7. **`conftest.py`** — AI's fixture called `redis_client.delete(*keys)` unconditionally. I added `if keys:` to handle the empty case.
8. **`requirements.txt` split** — AI suggested putting dev deps in the same file. I split into `requirements.txt` and `requirements-dev.txt` so the production image doesn't ship pytest.
9. **Groq JSON mode** — AI assumed all Groq models support `response_format: {"type": "json_object"}`. I tested and confirmed `openai/gpt-oss-20b` does.

### What I Do Not Fully Understand

This is my study list for the viva:

- How `terminationGracePeriodSeconds` and `preStop` sleep interact during zero-downtime rollouts
- VPA recommender timing versus HPA scale-down stabilization window
- Whether `psycopg` (v3) offers a concrete advantage over `psycopg2` for our synchronous use case
- Exactly how Prometheus histograms bucket the request latency
- The trade-off between `internal: true` network isolation and reachability of external LLM APIs

I will be able to explain every line at viva. If I cannot, I will read it again before the viva.

---

## [Partner Name] (frontend, Docker, K8s, CI/CD)

*(Partner fills this section)*

---

## Attestation

Every line committed to this repository has been read, understood, and where necessary modified by the named author. The viva is the proof.