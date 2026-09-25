from app.db import SessionLocal
from app.models.enums import Category, Priority, Status
from app.models.orm import Complaint

SEED_COMPLAINTS = [
    {"text": "Burst water main flooding Street 12 since morning, water entering ground floors", "location": "Street 12", "category": Category.water, "priority": Priority.high},
    {"text": "No water supply in Block C since yesterday evening", "location": "Block C", "category": Category.water, "priority": Priority.high},
    {"text": "Water leaking from underground pipe near market, road getting damaged", "location": "Main Market", "category": Category.water, "priority": Priority.normal},
    {"text": "Dirty water coming from taps in Sector G, smell is very bad", "location": "Sector G", "category": Category.water, "priority": Priority.normal},
    {"text": "Water tanker not arrived in Mohalla Abbasia for three days", "location": "Mohalla Abbasia", "category": Category.water, "priority": Priority.high},
    {"text": "Electric wire hanging low on Street 7, very dangerous for children", "location": "Street 7", "category": Category.electricity, "priority": Priority.high},
    {"text": "Transformer sparking near school, please fix urgently", "location": "School Road", "category": Category.electricity, "priority": Priority.high},
    {"text": "Power outage in whole colony since last night", "location": "Green Colony", "category": Category.electricity, "priority": Priority.high},
    {"text": "Streetlight pole broken and wire exposed on main road", "location": "Main Road", "category": Category.electricity, "priority": Priority.normal},
    {"text": "Frequent load shedding in our area, affecting business", "location": "Commercial Area", "category": Category.electricity, "priority": Priority.low},
    {"text": "Garbage not picked up from Street 4 for one week, smell is unbearable", "location": "Street 4", "category": Category.sanitation, "priority": Priority.high},
    {"text": "Sewage water overflowing on road near hospital", "location": "Hospital Road", "category": Category.sanitation, "priority": Priority.high},
    {"text": "Blocked drain causing water to enter houses in Mohalla Nizam", "location": "Mohalla Nizam", "category": Category.sanitation, "priority": Priority.high},
    {"text": "Public toilet in park is very dirty, not cleaned for days", "location": "City Park", "category": Category.sanitation, "priority": Priority.normal},
    {"text": "Dead animal lying on roadside, need immediate removal", "location": "Ring Road", "category": Category.sanitation, "priority": Priority.high},
    {"text": "Big pothole on main road causing accidents", "location": "Main Road", "category": Category.roads, "priority": Priority.high},
    {"text": "Road caved in near bus stop, very dangerous", "location": "Bus Stop Chowk", "category": Category.roads, "priority": Priority.high},
    {"text": "Footpath broken in front of school, children tripping", "location": "School Road", "category": Category.roads, "priority": Priority.normal},
    {"text": "Road needs repair after recent rain damage", "location": "Lake Road", "category": Category.roads, "priority": Priority.normal},
    {"text": "Speed breaker broken, cars speeding through residential area", "location": "Block D", "category": Category.roads, "priority": Priority.low},
    {"text": "Streetlight not working on Street 9, whole street is dark", "location": "Street 9", "category": Category.streetlights, "priority": Priority.high},
    {"text": "Flickering streetlight near mosque disturbing namaz", "location": "Jamia Masjid Road", "category": Category.streetlights, "priority": Priority.normal},
    {"text": "Streetlight pole leaning dangerously after storm", "location": "Park Avenue", "category": Category.streetlights, "priority": Priority.high},
    {"text": "No streetlights in new colony, unsafe at night", "location": "New Colony", "category": Category.streetlights, "priority": Priority.normal},
    {"text": "Streetlight on for whole day, wasting electricity", "location": "Garden Town", "category": Category.streetlights, "priority": Priority.low},
    {"text": "Stray dogs attacking children in the evening", "location": "Block B", "category": Category.other, "priority": Priority.high},
    {"text": "Illegal construction blocking public walkway", "location": "Main Bazaar", "category": Category.other, "priority": Priority.normal},
    {"text": "Noise from wedding hall late at night, disturbing residents", "location": "Canal Road", "category": Category.other, "priority": Priority.low},
    {"text": "Tree branch fallen on road after storm, blocking traffic", "location": "Mall Road", "category": Category.other, "priority": Priority.high},
    {"text": "Stray cattle on main road causing traffic jam", "location": "GT Road", "category": Category.other, "priority": Priority.normal},
]


def seed():
    db = SessionLocal()
    inserted = 0
    skipped = 0
    for item in SEED_COMPLAINTS:
        exists = (
            db.query(Complaint)
            .filter(Complaint.text == item["text"])
            .filter(Complaint.location == item["location"])
            .first()
        )
        if exists:
            skipped += 1
            continue
        db.add(
            Complaint(
                text=item["text"],
                location=item["location"],
                category=item["category"],
                priority=item["priority"],
                status=Status.open,
                triaged_by="seed",
                triage_latency_ms=0,
            )
        )
        inserted += 1
    db.commit()
    db.close()
    print(f"Seeded: {inserted} inserted, {skipped} skipped (already present)")


if __name__ == "__main__":
    seed()