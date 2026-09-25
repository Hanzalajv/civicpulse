from app.config import settings

from .base import TriageProvider
from .llm import LLMTriage
from .rules import RuleBasedTriage
from .simulated import SimulatedTriage


def get_provider(name: str | None = None) -> TriageProvider:
    provider = name or settings.triage_provider
    if provider == "llm":
        return LLMTriage()
    if provider == "rules":
        return RuleBasedTriage()
    if provider == "simulated":
        return SimulatedTriage()
    raise ValueError(f"Unknown TRIAGE_PROVIDER: {provider}")