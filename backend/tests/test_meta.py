def test_meta_providers(client):
    r = client.get("/api/meta/providers")
    assert r.status_code == 200
    body = r.json()
    assert "active_provider" in body
    assert "last_outcomes" in body