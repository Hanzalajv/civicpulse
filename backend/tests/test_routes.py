def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_ready(client):
    r = client.get("/ready")
    assert r.status_code == 200
    assert r.json()["status"] == "ready"


def test_post_complaint(client):
    r = client.post(
        "/api/complaints",
        json={
            "text": "Burst water pipe on test street flooding the road",
            "location": "test street routes",
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["category"] == "water"
    assert body["priority"] == "high"
    assert body["status"] == "open"


def test_post_complaint_validation_error(client):
    r = client.post(
        "/api/complaints",
        json={"text": "short", "location": "x"},
    )
    assert r.status_code == 422


def test_get_complaint_not_found(client):
    r = client.get("/api/complaints/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


def test_list_complaints(client):
    r = client.get("/api/complaints?page=1&page_size=5")
    assert r.status_code == 200
    body = r.json()
    assert "items" in body
    assert "total" in body


def test_patch_status_invalid_transition(client):
    create = client.post(
        "/api/complaints",
        json={
            "text": "Streetlight not working on test lane",
            "location": "test lane patch",
        },
    )
    cid = create.json()["id"]

    r1 = client.patch(f"/api/complaints/{cid}/status", json={"status": "resolved"})
    assert r1.status_code == 409

    r2 = client.patch(f"/api/complaints/{cid}/status", json={"status": "in_progress"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "in_progress"


def test_stats_cache_header(client):
    r1 = client.get("/api/stats")
    assert r1.headers.get("X-Cache") in ("MISS", "HIT")
    r2 = client.get("/api/stats")
    assert r2.headers.get("X-Cache") == "HIT"


def test_meta_providers(client):
    r = client.get("/api/meta/providers")
    assert r.status_code == 200
    assert "active_provider" in r.json()