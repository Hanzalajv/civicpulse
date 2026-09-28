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

## Sawaira-Fareed (frontend, Docker, CI/CD, K8s)

### Where AI Helped

**Scaffolding and boilerplate**
- Vite + React + TypeScript project scaffold — AI suggested the `--template react-ts` flag and the exact npm commands. I ran them and adjusted as needed.
- `frontend/src/api/client.ts` initial structure — AI provided the `request<T>()` helper pattern. I added the `X-Cache` header extraction, the 10s `AbortController` timeout, and the `response: Response | null` field on `ApiError`.
- Test skeletons in `frontend/src/**/*.test.tsx` — AI drafted the `vi.mock` blocks for `api`. I wrote the actual assertions after checking backend responses.
- Tailwind config, PostCSS config, and `@tailwind` directives in `index.css` — AI provided the initial structure. I chose the color tokens and custom spacing.

**Debugging**
- PowerShell quoting broke on `curl -d '{"...":"..."}'` for POST requests — AI suggested PowerShell's `Invoke-RestMethod` with `ConvertTo-Json`, which I used throughout.
- `git diff` showed `tsconfig.app.tsbuildinfo` was being tracked — AI flagged this as a build artifact. I removed it from the index and added it to `.gitignore`.
- ESLint `react-hooks/set-state-in-effect` on `Dashboard.tsx` — AI explained the cancellation-flag pattern. I applied it to `Dashboard.tsx`, `Complaints.tsx`, `Stats.tsx`, and `ComplaintDetail.tsx`.
- Frontend container kept restarting with `open() "/run/nginx.pid" failed (13: Permission denied)` — AI identified that nginx as a non-root user cannot write to `/run`. I added `touch /run/nginx.pid && chown nginx:nginx /run/nginx.pid /run`.
- Healthcheck stuck at "starting" — AI pointed out `localhost` resolves to IPv6 in Alpine, but nginx only listens on IPv4. I switched to `127.0.0.1`.
- Tests failed when I renamed `Dashboard.tsx` → `Complaints.tsx` — AI suggested role-based and placeholder-based queries instead of exact text. I switched from `getByText("Move to in_progress")` to `getByRole("button", { name: /Mark as in progress/i })`.

**Documentation drafts**
- `docs/evidence/network-isolation.txt` and `docs/evidence/persistence-after-down-up.txt` — AI provided the section headers. I pasted the actual command output and counts from my terminal.
- `compose.prod.yaml` initial structure — AI provided the `image: ${IMAGE_TAG}` skeleton with `deploy.resources.limits`. I verified against `docker compose config` and adjusted ports, networks, and volume mounts.

**UI redesign**
- Complaint Detail page structure — AI provided the two-column layout (main + sidebar), timeline, and AI Triage card. I wired it to `GET /api/complaints/{id}` and added the `onSelect` callback to `Complaints.tsx`.
- Tailwind sidebar layout — AI provided the `<aside>` with active-state highlighting. I chose colors and spacing.
- `Button` variants (primary / secondary / ghost / success / danger / lavender) — AI suggested the class map. I picked the specific Tailwind colors for reject / resolve / in-progress actions.

### What I Changed After AI Output

1. **`ApiError` constructor** — AI's first version took only 3 arguments (status, body, message). I added `response: Response | null` so consumers can inspect the raw HTTP response on failures. Had to update 8 call sites in `client.ts`.
2. **`request()` timeout** — AI had no timeout on the fetch. I added `AbortController` with 10s, and specific error classes: `status: 0` + `"Request timed out"` for aborts, `status: 0` + `"Network error"` for other failures.
3. **Test expectations on button labels** — AI's tests looked for "Move to in_progress". The UI button now says "Mark as in progress". I updated the regex matcher to `/Mark as in progress/i`.
4. **Cancellation flag pattern** — AI's original `useEffect` called `load()` directly, which triggered ESLint's `react-hooks/set-state-in-effect` rule. I moved the fetch inside the effect with a `cancelled` boolean and an early return.
5. **`tsconfig.app.json` types** — AI initially omitted `@testing-library/jest-dom/vitest`. VS Code showed red squiggles on `toBeInTheDocument()`. I added the types entry.
6. **Frontend Dockerfile user** — AI's first Dockerfile had no `USER nginx`. The container ran as root. I added the user and the writable directory setup, which surfaced the `/run/nginx.pid` issue that I then fixed.
7. **Prettier noise** — Every time I ran `npm run format`, Prettier reformatted files that weren't part of my PR. AI's suggestion was to `git add` everything. I instead added `git checkout -- <file>` for Prettier-only changes to keep PRs focused.
8. **Detail page navigation** — AI initially suggested React Router. I chose conditional rendering in `App.tsx` via a `selectedComplaintId` state, since the app is a single-page tab layout without real routing needs.
9. **`X-Cache` display in Stats** — AI's first version showed "HIT"/"MISS" as plain text. I colored it (amber for MISS, green for HIT) so the cache state is visually obvious during the demo.

### What I Do Not Fully Understand

This is my study list for the viva:

- How Docker's `internal: true` network flag interacts with DNS resolution at the resolver level, and why the frontend gets "bad address" instead of a timeout
- Why `nginx:1.27-alpine` requires the `/run/nginx.pid` file to exist before the process starts, but the official entrypoint doesn't create it
- Whether Vite's `/api` proxy configuration is truly equivalent to nginx's `proxy_pass` for the browser's same-origin policy
- The exact interaction between `tsc -b` (project references) and Vite's build when both read `tsconfig.app.json`
- How GitHub Actions caches `type=gha` for Docker builds — what's stored, where, and how cache misses are handled

I will be able to explain every line at viva. If I cannot, I will read it again before the viva.

## Attestation

Every line committed to this repository has been read, understood, and where necessary modified by the named author. The viva is the proof.