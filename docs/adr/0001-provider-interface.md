# ADR 0001: Triage Provider Interface

## Status
Accepted

## Context

The triage step must call an external classifier. Today it is a hosted LLM (Groq, Gemini). Tomorrow it may be a fine-tuned classifier, a self-hosted model, or a rule engine. The system around the classifier must not care which one runs.

Without an interface, every change to the classifier would ripple through the service layer, the routes, and the tests.

## Decision

Define a single Protocol:

```python
class TriageProvider(Protocol):
    name: str
    def triage(self, text: str, location: str) -> TriageResult: ...

    Four implementations:

LLMTriage — production path, Groq primary → Gemini secondary

RuleBasedTriage — deterministic keyword fallback, always available

SimulatedTriage — CI, offline, supports failure injection

OllamaTriage was considered and dropped in favor of Groq+Gemini chaining

Selection is by env var TRIAGE_PROVIDER, resolved in providers/triage/factory.py.

The service layer calls provider.triage(text, location). It never imports a concrete provider.

Consequences
Easier:

Swap providers without touching services or routes

Test fallback with a single injected provider

CI uses SimulatedTriage — deterministic, no network

Prompt-injection guardrail lives in one place

Harder:

Every new provider must return the same TriageResult shape

The factory must know every provider name

Changing the Protocol means updating all implementations

Accepted trade-off: the Protocol is the contract. Adding a fifth provider is one file plus one factory line.