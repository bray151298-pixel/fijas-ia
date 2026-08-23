"""Servicio de búsqueda web en tiempo real y fixture oficial en vivo ultrarrápido."""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
import re
import time
from urllib.parse import quote_plus
import httpx

from backend.app.core.logging import logger

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
}

ESPN_LEAGUES = [
    ("per.1", "Liga 1 Perú"),
    ("eng.1", "Premier League"),
    ("esp.1", "La Liga"),
    ("ita.1", "Serie A"),
    ("ger.1", "Bundesliga"),
    ("fra.1", "Ligue 1"),
    ("uefa.champions", "Champions League"),
    ("uefa.europa", "Europa League"),
    ("conmebol.libertadores", "Copa Libertadores"),
    ("conmebol.sudamericana", "Copa Sudamericana"),
    ("arg.1", "Liga Profesional Argentina"),
    ("mex.1", "Liga MX"),
    ("bra.1", "Brasileirão"),
    ("usa.1", "MLS"),
]

# Cache global: (timestamp, list[all_matches])
_ALL_MATCHES_CACHE: tuple[float, list[dict]] = (0.0, [])


def _fetch_league_matches(item: tuple[str, str, str]) -> list[dict]:
    league_code, league_name, date_str = item
    url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league_code}/scoreboard"
    if date_str:
        url += f"?dates={date_str}"
    matches = []
    try:
        r = httpx.get(url, timeout=2.5)
        if r.status_code == 200:
            events = r.json().get("events", [])
            for ev in events:
                name = ev.get("name", "")
                comp = ev.get("competitions", [{}])[0]
                competitors = comp.get("competitors", [])
                if len(competitors) < 2:
                    continue
                home_team = competitors[0].get("team", {}).get("displayName", "Local")
                away_team = competitors[1].get("team", {}).get("displayName", "Visitante")
                if competitors[0].get("homeAway") == "away":
                    home_team, away_team = away_team, home_team

                venue = comp.get("venue", {}).get("fullName", "Estadio por confirmar")
                kickoff = ev.get("date", "")
                status = ev.get("status", {}).get("type", {}).get("description", "Programado")

                all_searchable = f"{name} {home_team} {away_team} {league_name}".lower()
                matches.append({
                    "event": f"{home_team} vs {away_team}",
                    "home": home_team,
                    "away": away_team,
                    "league": league_name,
                    "kickoff": kickoff,
                    "venue": venue,
                    "status": status,
                    "_search": all_searchable,
                })
    except Exception:
        pass
    return matches


def get_all_live_fixtures() -> list[dict]:
    """Descarga todos los partidos oficiales de las ligas principales en paralelo con cache."""
    global _ALL_MATCHES_CACHE
    now = time.time()
    if _ALL_MATCHES_CACHE[1] and (now - _ALL_MATCHES_CACHE[0] < 900):  # 15 min TTL
        return _ALL_MATCHES_CACHE[1]

    today = datetime.utcnow()
    tomorrow = today + timedelta(days=1)
    d_today = today.strftime("%Y%m%d")
    d_tomorrow = tomorrow.strftime("%Y%m%d")

    work_items = []
    for code, name in ESPN_LEAGUES:
        work_items.append((code, name, d_today))
        work_items.append((code, name, d_tomorrow))

    all_matches = []
    try:
        with ThreadPoolExecutor(max_workers=14) as executor:
            results = executor.map(_fetch_league_matches, work_items)
            for m_list in results:
                all_matches.extend(m_list)
        _ALL_MATCHES_CACHE = (now, all_matches)
    except Exception as e:
        logger.warning(f"Error descargando fixtures en paralelo: {e}")

    return all_matches


def fetch_espn_live_fixtures(team_name: str) -> list[dict]:
    """Búsqueda instantánea en el cache en memoria de fixtures oficiales."""
    clean_q = team_name.lower().replace("club", "").replace("deportes", "").replace("liga 1", "").replace("fc", "").strip()
    clean_words = [w for w in clean_q.split() if len(w) > 3]

    all_fixtures = get_all_live_fixtures()
    matched = []
    for m in all_fixtures:
        s = m["_search"]
        if clean_q in s or (clean_words and any(w in s for w in clean_words)):
            matched.append(m)

    matched.sort(key=lambda x: x.get("kickoff", ""))
    return matched


def build_live_match_context(team_or_query: str) -> str:
    """Construye contexto de partido en vivo en < 100 milisegundos."""
    espn_matches = fetch_espn_live_fixtures(team_or_query)
    if espn_matches:
        m = espn_matches[0]
        return (
            f"CALENDARIO OFICIAL EN VIVO (ESPN):\n"
            f"- Partido Real: {m['event']}\n"
            f"- Torneo: {m['league']}\n"
            f"- Kickoff Oficial UTC: {m['kickoff']}\n"
            f"- Estadio: {m['venue']}\n"
            f"- Estado: {m['status']}"
        )
    return f"Búsqueda deportiva: analiza el próximo partido oficial de {team_or_query}."
