"""Smoke tests for VibeSync REST API."""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "running"
    assert "tick" in body


def test_find_path_poi():
    r = client.post(
        "/find-path",
        json={"seat_id": "POI_WASHROOM", "start_row": 5, "start_col": 5},
    )
    assert r.status_code == 200
    data = r.json()
    assert "path" in data
    assert data.get("seat_id") == "POI_WASHROOM"


def test_sos_invalid_seat():
    r = client.post("/sos", json={"seat_id": "ZZ99"})
    assert r.status_code == 404


def test_join_queue():
    r = client.post(
        "/join-queue",
        json={"user_id": "test-fan-1", "fan_interest": "cricket"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data.get("user_id") == "test-fan-1"
    assert "fan_interest" in data
