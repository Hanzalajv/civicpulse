from app.models.enums import Status

TRANSITIONS: dict[Status, set[Status]] = {
    Status.open: {Status.in_progress, Status.rejected},
    Status.in_progress: {Status.resolved, Status.rejected},
    Status.resolved: set(),
    Status.rejected: set(),
}


def can_transition(from_status: Status, to_status: Status) -> bool:
    return to_status in TRANSITIONS.get(from_status, set())
