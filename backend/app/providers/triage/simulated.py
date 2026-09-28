from app.models.schemas import TriageResult

from .rules import RuleBasedTriage


class SimulatedTriage:
    name = "simulated"

    def __init__(self, should_fail: bool = False, should_malform: bool = False):
        self.should_fail = should_fail
        self.should_malform = should_malform
        self._rules = RuleBasedTriage()

    def triage(self, text: str, location: str) -> TriageResult:
        if self.should_fail:
            raise RuntimeError("simulated provider failure")
        if self.should_malform:
            raise ValueError("simulated malformed JSON")
        return self._rules.triage(text, location)
