# ADR 0004: PII and Data Governance

## Status
Accepted

## Context

CivicPulse sends citizen complaint text to a hosted LLM for triage. Complaint text can contain:

- Names ("Ali reported...")
- Addresses ("Street 12, Block C")
- Phone numbers ("call me at 0300-1234567")
- Health or safety details ("water entering ground floor, elderly resident inside")

**The data leaves our infrastructure.** It travels over HTTPS to Groq's API (and, as fallback, to Google's Gemini API). We must decide what exposure is acceptable and document it.

Additional constraint: the assignment notes that on Google AI Studio's free tier, Google may use inputs to improve its models. This is a real risk for citizen data.

## Decision

We send the **complaint body and location only**. We do not send:

- The reporter's contact information (`reporter_contact`)
- Any persistent user identifier (there is none — the system is anonymous by default)
- IP addresses (rate limiter stores them in Redis for 60s, never persisted to the database)
- Any header that identifies the reporter

**We accept the exposure of complaint text to Groq and Gemini** for the following reasons:

1. The complaint text is inherently the input to the classification task. Redacting names and addresses would degrade the model's ability to detect category and priority (e.g., "hospital road" vs "school road" matters for urgency).
2. Both providers transmit over TLS and state data-handling policies we reviewed.
3. Groq's free developer tier does not use inputs for training by default.
4. Gemini's free tier **does** use inputs to improve models. We document this risk explicitly below.
5. The assignment mandates a fallback chain (Groq → Gemini → rules) and CI determinism. Both demand LLM access.

**We reject the alternative of redacting before sending** because:

- Regex-based redaction is unreliable for names and addresses in Urdu-influenced English
- The complaint text is short and context-heavy; redaction frequently removes category-relevant words
- Over-redaction increases rule-based fallbacks, which defeats the purpose of the LLM path

## Consequences

**What is protected:**

- Reporter contact information never leaves our infrastructure
- No authentication or user identity exists to leak
- IP addresses are stored only in Redis for rate limiting, TTL 60 seconds
- The database is on the `internal` Docker network with no internet route

**What is exposed:**

- Complaint text and location are sent to Groq in production
- If Groq fails, the same text is sent to Google (Gemini) as fallback
- **On Google's free tier, this text may be used to improve Google's models** (per Google's published terms)

**Mitigations in place:**

- `compose.yaml` and Kubernetes deployment documentation warn operators not to submit real PII during demos
- The seed script uses fictional complaints only
- Redis triage cache stores the raw text as part of its key (hashed) for 24h; this is local only
- Switching to `TRIAGE_PROVIDER=rules` disables all external calls — the system degrades gracefully

**Future work if this becomes production:**

- Move from Groq/Gemini free tiers to a **paid enterprise tier** where inputs are contractually excluded from training
- Or deploy **Ollama** in-cluster so no text ever leaves the network
- Add a redaction pass before sending (once a reliable Pakistani-context NER model is available)

## Reviewers' Note

This ADR intentionally records a **risk we accepted**, not one we solved. The assignment's CLO 8 (ethical reasoning around data) is best demonstrated by naming the trade-off, documenting the exposure, and stating the exit path — rather than pretending the trade-off does not exist.