"""Tests de integración para los endpoints de la API FastAPI."""
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_dashboard_metrics():
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "bankroll" in data
    assert "roi" in data
    assert "winrate" in data


def test_bets_listing():
    response = client.get("/api/bets")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_known_teams_autocomplete():
    response = client.get("/api/manual/known_teams")
    assert response.status_code == 200
    data = response.json()
    assert "teams" in data
    assert "count" in data


def test_manual_analysis_endpoint():
    payload = {
        "home_team": "Team A",
        "away_team": "Team B",
        "bookmaker": "TestBookie",
        "odds": {
            "home": 2.10,
            "draw": 3.40,
            "away": 3.20,
            "btts_yes": 1.85,
            "btts_no": 1.85,
            "over_25": 1.90,
            "under_25": 1.80
        }
    }
    response = client.post("/api/manual/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["home_team"] == "Team A"
    assert "predictions" in data
    assert "assessments" in data
    assert len(data["assessments"]) > 0


def test_parlay_endpoint():
    payload = {
        "legs": [
            {
                "home_team": "Team A",
                "away_team": "Team B",
                "market": "1X2",
                "selection": "HOME",
                "odd": 1.80
            },
            {
                "home_team": "Team C",
                "away_team": "Team D",
                "market": "BTTS",
                "selection": "YES",
                "odd": 1.90
            }
        ],
        "bankroll": 1000.0
    }
    response = client.post("/api/manual/parlay", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["n_legs"] == 2
    assert round(data["combined_odd"], 2) == round(1.80 * 1.90, 2)
    assert "combined_p_model" in data
