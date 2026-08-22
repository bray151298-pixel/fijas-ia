"""Motor de decisión Tipster.

Orquesta el pipeline completo para producir picks accionables:
  match → features → predicciones → cuotas → value detector → risk manager → pick
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Iterable

import pandas as pd
from sqlalchemy.orm import Session

from backend.app.core.logging import logger
from backend.app.ml.predict import Predictor
from backend.app.ml.value_detector import assess
from backend.app.schemas.dto import MatchDTO, ValueBetDTO
from backend.app.services.data_provider import DataProvider, get_provider
from backend.app.services.feature_engineering import (
    _build_team_indices, _features_using_index, compute_elo_history,
)
from backend.app.services.odds_aggregator import (best_1x2, best_btts,
                                                   best_over_under_25)
from backend.app.tipster.risk_manager import RiskManager


# Mapeos selección → mercado
_1X2_SELECTIONS = ["HOME", "DRAW", "AWAY"]


class DecisionEngine:
    def __init__(self, session: Session, history_df: pd.DataFrame,
                 predictor: Predictor, provider: DataProvider | None = None):
        self.session = session
        self.predictor = predictor
        self.provider = provider or get_provider()
        # Pre-computamos índices UNA sola vez por sesión del engine.
        # Antes: build_features_for_match reconstruía estos índices por cada
        # partido escaneado → 30-40s por scan. Ahora: ~0.5s.
        df_with_elo = compute_elo_history(history_df)
        self._team_idx, self._h2h_idx = _build_team_indices(df_with_elo)
        self.history_df = df_with_elo

    # ------------------------------------------------------------------
    def scan(self, on_date: date, bankroll: float, peak_bankroll: float,
             days_ahead: int = 7) -> list[ValueBetDTO]:
        """Escanea fixtures desde `on_date` hasta `on_date + days_ahead`.

        Por defecto mira la próxima semana entera (no solo hoy), porque las ligas
        no juegan todos los días. Devolver picks solo del día actual sería
        innecesariamente restrictivo.
        """
        risk = RiskManager(self.session, bankroll, peak_bankroll)
        fixtures: list = []
        for offset in range(days_ahead):
            d = on_date + timedelta(days=offset)
            day_fix = self.provider.get_fixtures(d)
            if day_fix:
                fixtures.extend(day_fix)
        if not fixtures:
            logger.info(f"No hay fixtures entre {on_date} y {on_date + timedelta(days=days_ahead)}")
            return []
        logger.info(f"Escaneando {len(fixtures)} partidos en los próximos {days_ahead} días")

        # Una sola llamada batch a odds
        odds_map = self.provider.get_odds([f.fixture_id for f in fixtures])

        picks: list[ValueBetDTO] = []
        for m in fixtures:
            try:
                picks.extend(self._scan_match(m, odds_map.get(m.fixture_id, []), risk))
            except Exception as e:
                logger.error(f"Error escaneando {m.home_team} vs {m.away_team}: {e}")
        # Orden: mayor EV primero
        picks.sort(key=lambda p: p.expected_value, reverse=True)
        return picks

    # ------------------------------------------------------------------
    def _scan_match(self, m: MatchDTO, snaps: list, risk: RiskManager) -> list[ValueBetDTO]:
        results: list[ValueBetDTO] = []
        if not snaps:
            return results

        feats = _features_using_index(self._team_idx, self._h2h_idx,
                                       m.home_team, m.away_team, m.kickoff)
        pred = self.predictor.predict(feats)

        # ----- 1X2 -----
        b = best_1x2(snaps)
        if b:
            for sel, p_m, o, p_f, book in [
                ("HOME", pred.p_home, b.o_home, b.p_fair_home, b.book_home),
                ("DRAW", pred.p_draw, b.o_draw, b.p_fair_draw, b.book_draw),
                ("AWAY", pred.p_away, b.o_away, b.p_fair_away, b.book_away),
            ]:
                self._emit(results, m, "1X2", sel, p_m, o, p_f, book, risk)

        # ----- BTTS -----
        bb = best_btts(snaps)
        if bb:
            for sel, p_m, o, p_f, book in [
                ("YES", pred.p_btts_yes, bb.o_yes, bb.p_fair_yes, bb.book_yes),
                ("NO", pred.p_btts_no, bb.o_no, bb.p_fair_no, bb.book_no),
            ]:
                self._emit(results, m, "BTTS", sel, p_m, o, p_f, book, risk)

        # ----- O/U 2.5 -----
        bo = best_over_under_25(snaps)
        if bo:
            for sel, p_m, o, p_f, book in [
                ("OVER", pred.p_over_25, bo.o_yes, bo.p_fair_yes, bo.book_yes),
                ("UNDER", pred.p_under_25, bo.o_no, bo.p_fair_no, bo.book_no),
            ]:
                self._emit(results, m, "OU25", sel, p_m, o, p_f, book, risk)
        return results

    def _emit(self, results: list[ValueBetDTO], m: MatchDTO,
              market: str, selection: str,
              p_m: float, o: float, p_f: float, book: str,
              risk: RiskManager) -> None:
        a = assess(p_m, o, p_f)
        if not a.is_value:
            return
        decision = risk.evaluate(p_m, o, m.fixture_id)
        if not decision.approved:
            return
        confidence = min(1.0, max(0.0, (a.expected_value / 0.20) * (a.edge / 0.10)))
        results.append(ValueBetDTO(
            match_id=m.fixture_id,
            home_team=m.home_team,
            away_team=m.away_team,
            league=m.league,
            kickoff=m.kickoff,
            market=market,
            selection=selection,
            odd=o,
            p_model=p_m,
            p_fair=p_f,
            edge=a.edge,
            expected_value=a.expected_value,
            suggested_stake=decision.suggested_stake,
            bankroll=risk.bankroll,
            bookmaker=book,
            confidence=confidence,
            rationale=a.rationale,
        ))
