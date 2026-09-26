from app.models.enums import Status
from app.services.state_machine import can_transition


def test_open_to_in_progress():
    assert can_transition(Status.open, Status.in_progress)


def test_open_to_rejected():
    assert can_transition(Status.open, Status.rejected)


def test_open_to_resolved_invalid():
    assert not can_transition(Status.open, Status.resolved)


def test_in_progress_to_resolved():
    assert can_transition(Status.in_progress, Status.resolved)


def test_in_progress_to_rejected():
    assert can_transition(Status.in_progress, Status.rejected)


def test_resolved_terminal():
    assert not can_transition(Status.resolved, Status.open)
    assert not can_transition(Status.resolved, Status.in_progress)


def test_rejected_terminal():
    assert not can_transition(Status.rejected, Status.open)
    assert not can_transition(Status.rejected, Status.in_progress)