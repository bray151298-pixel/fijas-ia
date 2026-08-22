"""Notificador Telegram (síncrono via httpx)."""
from __future__ import annotations

from typing import Iterable

import httpx

from backend.app.config import settings
from backend.app.core.logging import logger
from backend.app.schemas.dto import ValueBetDTO


def _format_pick(p: ValueBetDTO) -> str:
    return (
        f"🎯 <b>{p.home_team} vs {p.away_team}</b>\n"
        f"🏆 {p.league}\n"
        f"📊 Mercado: <b>{p.market} / {p.selection}</b>\n"
        f"💰 Cuota: <b>{p.odd:.2f}</b> ({p.bookmaker})\n"
        f"🤖 Prob modelo: {p.p_model:.1%} | Prob fair: {p.p_fair:.1%}\n"
        f"📈 EV: <b>{p.expected_value:+.1%}</b> | Edge: {p.edge:+.1%}\n"
        f"💵 Stake sugerido: <b>{p.suggested_stake:.2f}</b>\n"
        f"🕐 {p.kickoff:%Y-%m-%d %H:%M UTC}\n"
    )


def send_picks(picks: Iterable[ValueBetDTO]) -> bool:
    """Envía un mensaje con los picks por Telegram. Devuelve True si se envió."""
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        logger.info("Telegram no configurado — saltando alerta.")
        return False

    picks = list(picks)
    if not picks:
        return False

    text = "<b>🚨 Tipster IA — Picks recomendados</b>\n\n" + "\n".join(_format_pick(p) for p in picks)
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    try:
        r = httpx.post(url, json={
            "chat_id": settings.telegram_chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }, timeout=10.0)
        r.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Telegram send error: {e}")
        return False
