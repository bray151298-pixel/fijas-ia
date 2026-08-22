"""Risk Manager — capa final antes de aprobar una apuesta.

Implementa todas las protecciones detalladas en ARCHITECTURE.md §4:
  - Kelly fraccional (calculado en ml/kelly.py)
  - Hard cap por apuesta
  - Stop-loss diario
  - Drawdown guard
  - Cap de exposición simultánea
  - Correlación entre apuestas (mismo partido / liga)
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from typing import Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.core.logging import logger
from backend.app.ml.kelly import kelly_fraction
from backend.app.models import Bet, BetStatus


@dataclass
class RiskDecision:
    approved: bool
    suggested_stake: float
    reason: str


class RiskManager:
    """Encapsula todas las reglas de gestión de riesgo."""

    def __init__(self, session: Session, bankroll: float, peak_bankroll: float | None = None):
        self.session = session
        self.bankroll = bankroll
        self.peak_bankroll = peak_bankroll or bankroll
        self.allocated_exposure: float = 0.0
        self.allocated_matches: dict[int, int] = defaultdict(int)

    # ------------------------------------------------------------------------
    # Diagnósticos del estado de la banca
    # ------------------------------------------------------------------------
    def daily_pnl(self, on_date: date | None = None) -> float:
        on_date = on_date or datetime.now(timezone.utc).date()
        start_of_day = datetime.combine(on_date, time.min)
        end_of_day = start_of_day + timedelta(days=1)
        stmt = select(func.coalesce(func.sum(Bet.pnl), 0.0)).where(
            Bet.status.in_([BetStatus.WON, BetStatus.LOST]),
            Bet.settled_at >= start_of_day,
            Bet.settled_at < end_of_day,
        )
        return float(self.session.execute(stmt).scalar() or 0.0)

    def open_exposure(self) -> float:
        stmt = select(func.coalesce(func.sum(Bet.stake), 0.0)).where(Bet.status == BetStatus.PENDING)
        db_exposure = float(self.session.execute(stmt).scalar() or 0.0)
        return db_exposure + self.allocated_exposure

    def drawdown_pct(self) -> float:
        if self.peak_bankroll <= 0:
            return 0.0
        return max(0.0, (self.peak_bankroll - self.bankroll) / self.peak_bankroll)

    # ------------------------------------------------------------------------
    # Decisión final
    # ------------------------------------------------------------------------
    def evaluate(self, p_model: float, odd: float, match_id: int) -> RiskDecision:
        # 1. Kelly base
        f = kelly_fraction(p_model, odd)
        if f <= 0:
            return RiskDecision(False, 0.0, "kelly = 0 (edge negativo)")

        # 2. Drawdown guard
        if self.drawdown_pct() >= settings.drawdown_threshold_pct:
            f *= 0.5
            logger.warning(f"Drawdown {self.drawdown_pct():.1%} >= {settings.drawdown_threshold_pct:.0%} — stake reducido 50%")

        # 3. Stop-loss diario
        if self.daily_pnl() <= -settings.daily_stop_loss_pct * self.peak_bankroll:
            return RiskDecision(False, 0.0,
                                f"stop-loss diario activado (pnl={self.daily_pnl():.2f})")

        # 4. Cap de exposición simultánea (10% banca)
        max_simultaneous = 0.10 * self.bankroll
        current_exp = self.open_exposure()
        proposed_stake = f * self.bankroll
        if current_exp + proposed_stake > max_simultaneous:
            available = max(0.0, max_simultaneous - current_exp)
            if available <= 0:
                return RiskDecision(False, 0.0, "exposición simultánea alcanzaría el 10%")
            proposed_stake = min(proposed_stake, available)

        # 5. Correlación: misma match_id (otra apuesta sobre el mismo partido)
        db_same_match = self.session.execute(
            select(func.count()).select_from(Bet).where(
                Bet.match_id == match_id, Bet.status == BetStatus.PENDING)
        ).scalar() or 0
        total_same_match = db_same_match + self.allocated_matches[match_id]
        if total_same_match >= 1:
            proposed_stake *= 0.5  # reducción por correlación

        # 6. Stake mínimo razonable
        if proposed_stake < 1.0:
            return RiskDecision(False, 0.0, f"stake propuesto {proposed_stake:.2f} < 1")

        final_stake = round(proposed_stake, 2)
        self.allocated_exposure += final_stake
        self.allocated_matches[match_id] += 1

        return RiskDecision(True, final_stake,
                            f"aprobado: f={f:.4f}, banca={self.bankroll:.2f}")
