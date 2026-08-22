"""Tests unitarios para feature engineering y ELO."""
from datetime import datetime
import pandas as pd
import pytest

from backend.app.services.feature_engineering import (
    EloConfig,
    _build_team_indices,
    _h2h_winrate,
    _last_n_stats,
    compute_elo_history,
    update_elo,
)


def test_update_elo_home_win():
    eh, ea = update_elo(1500.0, 1500.0, 2, 0)
    assert eh > 1500.0
    assert ea < 1500.0
    assert round(eh + ea, 2) == 3000.0  # Conservación de suma ELO


def test_update_elo_away_win():
    eh, ea = update_elo(1500.0, 1500.0, 0, 3)
    assert eh < 1500.0
    assert ea > 1500.0


def test_update_elo_draw():
    # Con ventaja de campo (home_field=65), un empate reduce ligeramente el ELO del local
    eh, ea = update_elo(1500.0, 1500.0, 1, 1)
    assert eh < 1500.0
    assert ea > 1500.0


def test_compute_elo_history():
    data = [
        {"kickoff": datetime(2026, 1, 1), "home_team": "TeamA", "away_team": "TeamB", "home_goals": 2, "away_goals": 0},
        {"kickoff": datetime(2026, 1, 8), "home_team": "TeamB", "away_team": "TeamA", "home_goals": 1, "away_goals": 1},
    ]
    df = pd.DataFrame(data)
    df_elo = compute_elo_history(df)

    assert "elo_home_pre" in df_elo.columns
    assert "elo_away_pre" in df_elo.columns
    assert df_elo.iloc[0]["elo_home_pre"] == 1500.0
    assert df_elo.iloc[0]["elo_away_pre"] == 1500.0
    assert df_elo.iloc[1]["elo_away_pre"] > 1500.0  # TeamA ganó el primer partido


def test_team_indices_and_h2h():
    data = [
        {"kickoff": datetime(2026, 1, 1), "home_team": "TeamA", "away_team": "TeamB", "home_goals": 3, "away_goals": 1},
        {"kickoff": datetime(2026, 1, 8), "home_team": "TeamB", "away_team": "TeamA", "home_goals": 0, "away_goals": 2},
    ]
    df = pd.DataFrame(data)
    team_idx, h2h_idx = _build_team_indices(df)

    # TeamA ganó ambos
    h2h_rate = _h2h_winrate(h2h_idx, "TeamA", "TeamB", as_of_ts=datetime(2026, 1, 15).timestamp())
    assert h2h_rate == 1.0

    stats_a = _last_n_stats(team_idx["TeamA"], as_of_ts=datetime(2026, 1, 15).timestamp(), n=5)
    assert stats_a["gf_avg"] == 2.5  # (3 + 2) / 2
    assert stats_a["form_pts"] == 6.0  # 3 + 3 puntos
