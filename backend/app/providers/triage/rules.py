from app.models.enums import Category, Priority
from app.models.schemas import TriageResult


class RuleBasedTriage:
    name = "rules"

    KEYWORDS = {
        Category.water: ["water", "leak", "pipe", "flood", "main", "supply", "tanker"],
        Category.electricity: ["electric", "power", "wire", "transformer", "outage", "load shedding"],
        Category.sanitation: ["garbage", "sewage", "drain", "waste", "toilet", "dirty", "smell"],
        Category.roads: ["road", "pothole", "street", "pavement", "cave", "footpath", "speed breaker"],
        Category.streetlights: ["streetlight", "lamp", "dark", "pole", "light"],
    }

    URGENT_KEYWORDS = ["burst", "flood", "emergency", "danger", "urgent", "accident", "sparking", "overflow"]

    def triage(self, text: str, location: str) -> TriageResult:
        text_lower = text.lower()
        for category, keywords in self.KEYWORDS.items():
            if any(k in text_lower for k in keywords):
                priority = (
                    Priority.high
                    if any(w in text_lower for w in self.URGENT_KEYWORDS)
                    else Priority.normal
                )
                return TriageResult(
                    category=category,
                    priority=priority,
                    summary=text[:140],
                    confidence=0.6,
                )
        return TriageResult(
            category=Category.other,
            priority=Priority.normal,
            summary=text[:140],
            confidence=0.3,
        )