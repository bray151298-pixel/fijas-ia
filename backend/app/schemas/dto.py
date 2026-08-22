"""DTOs de transporte (Pydantic) para la API y el dominio."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MatchDTO(BaseModel):
    fixture_id: int
    league: str
    season: int
    kickoff: datetime
    home_team: str
    away_team: str
    status: str = "SCHEDULED"
    home_goals: Optional[int] = None
    away_goals: Optional[int] = None


class OddsDTO(BaseModel):
    bookmaker: str
    o_home: Optional[float] = None
    o_draw: Optional[float] = None
    o_away: Optional[float] = None
    o_btts_yes: Optional[float] = None
    o_btts_no: Optional[float] = None
    o_over_25: Optional[float] = None
    o_under_25: Optional[float] = None


class PredictionDTO(BaseModel):
    model_config = {"protected_namespaces": ()}

    match_id: int
    p_home: float
    p_draw: float
    p_away: float
    p_btts_yes: float
    p_over_25: float
    model_version: str


class ValueBetDTO(BaseModel):
    match_id: int
    home_team: str
    away_team: str
    league: str
    kickoff: datetime
    market: str
    selection: str
    odd: float
    p_model: float
    p_fair: float
    edge: float
    expected_value: float
    suggested_stake: float
    bankroll: float
    bookmaker: str
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str


class DashboardMetrics(BaseModel):
    bankroll: float
    initial_bankroll: float
    total_bets: int
    won: int
    lost: int
    pending: int
    pnl: float
    roi: float
    winrate: float
    max_drawdown: float
    peak_bankroll: float
    brier_1x2: Optional[float] = None
