import pytest

from app.models.enums import Category, Priority
from app.providers.triage.rules import RuleBasedTriage
from app.providers.triage.simulated import SimulatedTriage
from app.providers.triage.factory import get_provider


def test_rules_detects_water_high():
    result = RuleBasedTriage().triage("burst water main on street 12", "street 12")
    assert result.category == Category.water
    assert result.priority == Priority.high


def test_rules_detects_streetlight():
    result = RuleBasedTriage().triage("streetlight not working", "street 9")
    assert result.category == Category.streetlights


def test_rules_falls_back_to_other():
    result = RuleBasedTriage().triage("something completely random here", "place")
    assert result.category == Category.other


def test_simulated_delegates_to_rules():
    result = SimulatedTriage().triage("burst water main on street", "street 12")
    assert result.category == Category.water
    assert result.priority == Priority.high


def test_simulated_failure_injection():
    with pytest.raises(RuntimeError):
        SimulatedTriage(should_fail=True).triage("x", "y")


def test_simulated_malformed_injection():
    with pytest.raises(ValueError):
        SimulatedTriage(should_malform=True).triage("x", "y")


def test_factory_returns_rules():
    provider = get_provider("rules")
    assert provider.name == "rules"


def test_factory_returns_simulated():
    provider = get_provider("simulated")
    assert provider.name == "simulated"


def test_factory_unknown():
    with pytest.raises(ValueError):
        get_provider("nonexistent")