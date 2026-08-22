"""Tests unitarios de la lógica financiera crítica."""
import math

import pytest

from backend.app.ml.kelly import kelly_fraction
from backend.app.ml.value_detector import assess


# --- Kelly ---
def test_kelly_zero_when_negative_edge():
    # cuota 2.0, prob 0.4 → edge negativo
    assert kelly_fraction(0.4, 2.0) == 0.0


def test_kelly_positive_with_edge():
    # cuota 2.0, prob 0.6 → b=1, edge=0.6*1 - 0.4 = 0.2
    # f* = 0.2/1 = 0.2; con fraction=0.25 → 0.05; cap=0.02 → 0.02
    f = kelly_fraction(0.6, 2.0, fraction=0.25, cap_pct=0.10)
    assert math.isclose(f, 0.05, rel_tol=1e-6)


def test_kelly_capped():
    f = kelly_fraction(0.9, 2.0, fraction=1.0, cap_pct=0.02)
    assert f == 0.02


# --- Value detector ---
def test_value_passes_when_ev_and_p_above_thresholds():
    a = assess(p_model=0.7, odd=2.0, p_fair=0.55, min_p=0.6, min_ev=0.05)
    # EV = 0.7*1 - 0.3 = 0.4; edge = 0.15 → pasa
    assert a.is_value is True


def test_value_fails_low_probability():
    a = assess(p_model=0.55, odd=3.0, p_fair=0.30, min_p=0.6, min_ev=0.05)
    # EV alto pero p_model < 0.6
    assert a.is_value is False


def test_value_fails_low_odd():
    a = assess(p_model=0.85, odd=1.30, p_fair=0.80, min_p=0.6, min_ev=0.05)
    # cuota < 1.40 → descartado
    assert a.is_value is False


def test_value_fails_high_odd():
    a = assess(p_model=0.61, odd=10.0, p_fair=0.10, min_p=0.6, min_ev=0.05)
    # cuota > 8 → long shot, descartado
    assert a.is_value is False
