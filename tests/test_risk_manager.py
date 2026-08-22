"""Tests unitarios para el RiskManager."""
from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.models.bet import Bet, BetStatus
from backend.app.tipster.risk_manager import RiskManager


@pytest.fixture
def db_session():
    """Crea una base de datos SQLite en memoria para tests aislados."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_risk_manager_approval_and_sizing(db_session):
    # Banca = 1000, cuota = 2.0, p_model = 0.70
    # b = 1, edge = 0.7*1 - 0.3 = 0.4, f_full = 0.4
    # Kelly 0.25 -> 0.10, capped at 0.02 -> 2% = 20.0
    rm = RiskManager(db_session, bankroll=1000.0, peak_bankroll=1000.0)
    decision = rm.evaluate(p_model=0.70, odd=2.0, match_id=101)
    assert decision.approved is True
    assert decision.suggested_stake == 20.0


def test_risk_manager_drawdown_guard(db_session):
    # Banca actual 750 con peak 1000 -> Drawdown = 25% (>= threshold 20%)
    # Stake del 2% normal ($15) se reduce al 50% ($7.50)
    rm = RiskManager(db_session, bankroll=750.0, peak_bankroll=1000.0)
    decision = rm.evaluate(p_model=0.70, odd=2.0, match_id=101)
    assert decision.approved is True
    assert decision.suggested_stake == 7.50


def test_risk_manager_daily_stop_loss(db_session):
    # Simular apuestas perdidas hoy por -60 (umbral diario 5% de 1000 = -50)
    today = datetime.now(timezone.utc)
    bet = Bet(
        match_id=99,
        market="1X2",
        selection="HOME",
        odd=2.0,
        stake=60.0,
        bankroll_at_bet=1000.0,
        p_model=0.6,
        expected_value=0.1,
        edge=0.1,
        bookmaker="Test",
        status=BetStatus.LOST,
        settled_at=today,
        pnl=-60.0,
    )
    db_session.add(bet)
    db_session.commit()

    rm = RiskManager(db_session, bankroll=940.0, peak_bankroll=1000.0)
    decision = rm.evaluate(p_model=0.70, odd=2.0, match_id=101)
    assert decision.approved is False
    assert "stop-loss diario" in decision.reason


def test_risk_manager_batch_exposure_limit(db_session):
    # Banca = 1000, límite máximo simultáneo = 10% = 100.0
    # Cada apuesta = 20.0 (2%). A la 6ta apuesta se debe rechazar o topar.
    rm = RiskManager(db_session, bankroll=1000.0, peak_bankroll=1000.0)
    
    stakes = []
    for i in range(6):
        dec = rm.evaluate(p_model=0.70, odd=2.0, match_id=i + 1)
        if dec.approved:
            stakes.append(dec.suggested_stake)

    assert len(stakes) == 5
    assert sum(stakes) == 100.0  # Exactamente el 10% de la banca


def test_risk_manager_match_correlation(db_session):
    # Segunda apuesta para el mismo partido recibe 50% de reducción
    rm = RiskManager(db_session, bankroll=1000.0, peak_bankroll=1000.0)
    dec1 = rm.evaluate(p_model=0.70, odd=2.0, match_id=101)
    dec2 = rm.evaluate(p_model=0.70, odd=2.0, match_id=101)

    assert dec1.approved is True
    assert dec1.suggested_stake == 20.0
    assert dec2.approved is True
    assert dec2.suggested_stake == 10.0  # 50% de reducción por correlación
