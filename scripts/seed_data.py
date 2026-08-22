"""Genera un dataset sintético realista de partidos para demo y backtesting offline.

Cómo logra realismo:
  - Cada equipo tiene una "fuerza" latente (mu_attack, mu_defense, home_advantage).
  - Goles por partido se sortean de Poisson(lambda) donde lambda depende de las fuerzas.
  - Cuotas se generan a partir de las probabilidades reales + un margen de bookmaker
    realista (~5-7%) + ruido para simular distintas casas.
  - Distribución de resultados ~ datos históricos reales: ~46% home win, ~26% draw,
    ~28% away win, BTTS ~52%, Over 2.5 ~52%.

Uso:
    python -m scripts.seed_data
"""
from __future__ import annotations

import math
from pathlib import Path
import random
import sys
from datetime import datetime, timedelta

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd

from backend.app.core.database import init_db, session_scope
from backend.app.core.logging import logger
from backend.app.models import Match, MatchStatus

random.seed(42)
np.random.seed(42)

LEAGUES = [
    ("Premier League", "England"),
    ("La Liga", "Spain"),
    ("Serie A", "Italy"),
    ("Bundesliga", "Germany"),
    ("Ligue 1", "France"),
]
TEAMS_PER_LEAGUE = 16
DAYS_OF_HISTORY = 540  # 18 meses
SEASON = 2024


def _team_strength():
    """mu_attack y mu_def alrededor de 1.4 (promedio goles)."""
    return {
        "mu_att": float(np.random.normal(1.4, 0.35)),
        "mu_def": float(np.random.normal(1.4, 0.35)),
    }


def _build_teams():
    teams = {}
    for lg_name, country in LEAGUES:
        for i in range(TEAMS_PER_LEAGUE):
            name = f"{lg_name[:3]}-Team-{i+1:02d}"
            teams[name] = {"league": f"{lg_name} ({country})", **_team_strength()}
    return teams


def _odds_from_probs(p_h, p_d, p_a, margin=0.06, jitter=0.005):
    """Convierte prob fair a cuotas con margen de bookmaker + ruido.
    El bookie infla cada probabilidad (de modo que la suma exceda 1) → cuotas más bajas.
    El jitter es multiplicativo y simula diferencias entre casas."""
    factor = 1 + margin
    p_h_mkt = p_h * factor * max(0.85, 1 + np.random.normal(0, jitter))
    p_d_mkt = p_d * factor * max(0.85, 1 + np.random.normal(0, jitter))
    p_a_mkt = p_a * factor * max(0.85, 1 + np.random.normal(0, jitter))
    return 1.0 / p_h_mkt, 1.0 / p_d_mkt, 1.0 / p_a_mkt


def _binary_odds(p_yes, margin=0.05, jitter=0.005):
    p_no = 1 - p_yes
    factor = 1 + margin
    p_yes_m = p_yes * factor * max(0.85, 1 + np.random.normal(0, jitter))
    p_no_m = p_no * factor * max(0.85, 1 + np.random.normal(0, jitter))
    return 1.0 / p_yes_m, 1.0 / p_no_m


def _simulate_match(home, away, teams):
    h, a = teams[home], teams[away]
    home_advantage = 0.20  # 20% boost al local
    lambda_h = max(0.1, h["mu_att"] * (1 + home_advantage) / max(0.5, a["mu_def"]))
    lambda_a = max(0.1, a["mu_att"] / max(0.5, h["mu_def"]))
    hg = int(np.random.poisson(lambda_h))
    ag = int(np.random.poisson(lambda_a))
    hg = min(hg, 8)  # truncamos extremos
    ag = min(ag, 8)

    # Probabilidades fair (a partir de Poisson teórico)
    max_g = 10
    p_h = p_d = p_a = 0.0
    p_btts = 0.0
    p_over25 = 0.0
    for i in range(max_g):
        for j in range(max_g):
            p_ij = (np.exp(-lambda_h) * lambda_h**i / math.factorial(i)) * \
                   (np.exp(-lambda_a) * lambda_a**j / math.factorial(j))
            if i > j: p_h += p_ij
            elif i == j: p_d += p_ij
            else: p_a += p_ij
            if i > 0 and j > 0: p_btts += p_ij
            if i + j > 2.5: p_over25 += p_ij

    o_h, o_d, o_a = _odds_from_probs(p_h, p_d, p_a)
    o_btts_y, o_btts_n = _binary_odds(p_btts)
    o_o25, o_u25 = _binary_odds(p_over25)

    # xG aproximado (lambda con un poco de ruido)
    home_xg = round(lambda_h + np.random.normal(0, 0.2), 2)
    away_xg = round(lambda_a + np.random.normal(0, 0.2), 2)

    return {
        "home_goals": hg, "away_goals": ag,
        "home_xg": home_xg, "away_xg": away_xg,
        "o_home": round(o_h, 2), "o_draw": round(o_d, 2), "o_away": round(o_a, 2),
        "o_btts_yes": round(o_btts_y, 2), "o_btts_no": round(o_btts_n, 2),
        "o_over_25": round(o_o25, 2), "o_under_25": round(o_u25, 2),
    }


def generate_synthetic() -> pd.DataFrame:
    teams = _build_teams()
    rows = []
    fixture_id = 1
    start = datetime.utcnow() - timedelta(days=DAYS_OF_HISTORY)

    # Agrupamos equipos por liga
    by_league: dict[str, list[str]] = {}
    for name, info in teams.items():
        by_league.setdefault(info["league"], []).append(name)

    # Generamos jornadas semi-realistas
    day = 0
    while day < DAYS_OF_HISTORY + 7:  # 7 días en el futuro para "today"
        kickoff_day = start + timedelta(days=day)
        # cada liga juega ~1 jornada por semana (sábado/domingo aproximado)
        for league, lst in by_league.items():
            if day % 7 not in {5, 6}:  # solo viernes y sábado
                continue
            order = list(lst)
            random.shuffle(order)
            for i in range(0, len(order) - 1, 2):
                home, away = order[i], order[i + 1]
                kickoff = kickoff_day.replace(hour=random.choice([13, 16, 18, 21]), minute=0, second=0, microsecond=0)
                sim = _simulate_match(home, away, teams)
                # Fixtures futuros: dejamos goles en NaN
                in_future = kickoff > datetime.utcnow()
                rows.append({
                    "fixture_id": fixture_id,
                    "league": league,
                    "season": SEASON,
                    "kickoff": kickoff,
                    "home_team": home,
                    "away_team": away,
                    "status": "SCHEDULED" if in_future else "FINISHED",
                    "home_goals": np.nan if in_future else sim["home_goals"],
                    "away_goals": np.nan if in_future else sim["away_goals"],
                    "home_xg": sim["home_xg"],
                    "away_xg": sim["away_xg"],
                    "o_home": sim["o_home"], "o_draw": sim["o_draw"], "o_away": sim["o_away"],
                    "o_btts_yes": sim["o_btts_yes"], "o_btts_no": sim["o_btts_no"],
                    "o_over_25": sim["o_over_25"], "o_under_25": sim["o_under_25"],
                })
                fixture_id += 1
        day += 1
    return pd.DataFrame(rows)


def seed_database(df: pd.DataFrame):
    """Inserta los partidos en la base de datos."""
    init_db()
    with session_scope() as s:
        # Wipe matches existentes
        s.query(Match).delete()
        s.commit()
        for _, r in df.iterrows():
            status = MatchStatus.FINISHED if r["status"] == "FINISHED" else MatchStatus.SCHEDULED
            s.add(Match(
                fixture_id=int(r["fixture_id"]),
                league=str(r["league"]),
                season=int(r["season"]),
                kickoff=r["kickoff"],
                home_team=str(r["home_team"]),
                away_team=str(r["away_team"]),
                status=status,
                home_goals=int(r["home_goals"]) if pd.notna(r["home_goals"]) else None,
                away_goals=int(r["away_goals"]) if pd.notna(r["away_goals"]) else None,
                home_xg=float(r["home_xg"]),
                away_xg=float(r["away_xg"]),
            ))


def main():
    out = Path("data/synthetic_matches.csv")
    out.parent.mkdir(parents=True, exist_ok=True)
    df = generate_synthetic()
    df.to_csv(out, index=False)
    logger.info(f"Generadas {len(df)} filas → {out}")
    seed_database(df)
    logger.info("Base de datos sembrada.")


if __name__ == "__main__":
    main()
