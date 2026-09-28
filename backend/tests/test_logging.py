def test_request_id_propagated(client):
    r = client.get("/health", headers={"X-Request-ID": "test-abc-123"})
    assert r.headers.get("X-Request-ID") == "test-abc-123"


def test_request_id_generated_when_missing(client):
    r = client.get("/health")
    assert r.headers.get("X-Request-ID") is not None
    assert len(r.headers.get("X-Request-ID")) > 10