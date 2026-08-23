"""Servicio de búsqueda web en tiempo real y fixture oficial en vivo."""
from __future__ import annotations

from datetime import datetime, timedelta
import re
from urllib.parse import quote_plus
import httpx

from backend.app.core.logging import logger

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
}

# Ligas soportadas en vivo vía ESPN API pública
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


def fetch_espn_live_fixtures(team_name: str) -> list[dict]:
    """Busca en los scoreboards de ESPN el próximo partido real del equipo."""
    normalized_query = team_name.lower().replace("club", "").replace("deportes", "").replace("fc", "").strip()
    found_matches: list[dict] = []
    
    # Buscar hoy y los próximos 7 días
    today = datetime.utcnow()
    dates_to_check = [(today + timedelta(days=i)).strftime("%Y%m%d") for i in range(8)]
    
    try:
        with httpx.Client(timeout=4.0) as client:
            for league_code, league_name in ESPN_LEAGUES:
                for date_str in dates_to_check[:4]:  # Próximos 4 días primero
                    url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league_code}/scoreboard?dates={date_str}"
                    try:
                        r = client.get(url)
                        if r.status_code != 200:
                            continue
                        events = r.json().get("events", [])
                        for ev in events:
                            name = ev.get("name", "")
                            short_name = ev.get("shortName", "")
                            comp = ev.get("competitions", [{}])[0]
                            competitors = comp.get("competitors", [])
                            
                            team_names = [c.get("team", {}).get("displayName", "").lower() for c in competitors]
                            team_short_names = [c.get("team", {}).get("shortDisplayName", "").lower() for c in competitors]
                            all_names = " ".join(team_names + team_short_names + [name.lower()])
                            
                            # Comprobar coincidencia
                            if normalized_query in all_names or any(w in all_names for w in normalized_query.split() if len(w) > 3):
                                home_team = competitors[0].get("team", {}).get("displayName", "Local") if competitors else "Local"
                                away_team = competitors[1].get("team", {}).get("displayName", "Visitante") if len(competitors) > 1 else "Visitante"
                                if competitors and competitors[0].get("homeAway") == "away":
                                    home_team, away_team = away_team, home_team
                                
                                venue = comp.get("venue", {}).get("fullName", "Estadio por confirmar")
                                kickoff = ev.get("date", "")
                                status = ev.get("status", {}).get("type", {}).get("description", "Programado")
                                
                                found_matches.append({
                                    "event": f"{home_team} vs {away_team}",
                                    "home": home_team,
                                    "away": away_team,
                                    "league": league_name,
                                    "kickoff": kickoff,
                                    "venue": venue,
                                    "status": status,
                                })
                                break
                    except Exception:
                        continue
                if found_matches:
                    break
    except Exception as e:
        logger.warning(f"Error consultando ESPN live fixtures: {e}")

    return found_matches


def search_web_live(query: str, max_results: int = 5) -> list[str]:
    """Realiza una búsqueda web en vivo y devuelve los snippets más relevantes."""
    results: list[str] = []
    try:
        with httpx.Client(timeout=6.0, follow_redirects=True) as client:
            r = client.post("https://html.duckduckgo.com/html/", data={"q": query}, headers=HEADERS)
            if r.status_code == 200:
                snippets = re.findall(r'<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', r.text)
                for s in snippets[:max_results]:
                    clean = re.sub(r"<[^<]+?>", "", s).strip()
                    clean = clean.replace("&#x27;", "'").replace("&quot;", '"').replace("&amp;", "&").replace("&#39;", "'")
                    if clean and len(clean) > 20:
                        results.append(clean)
    except Exception as e:
        logger.warning(f"Error en búsqueda web para '{query}': {e}")
    return results


def build_live_match_context(team_or_query: str) -> str:
    """Combina los fixtures oficiales de ESPN con búsqueda web para máxima precisión."""
    # 1. Buscar fixture oficial
    espn_matches = fetch_espn_live_fixtures(team_or_query)
    
    parts = []
    if espn_matches:
        m = espn_matches[0]
        parts.append(
            f"CALENDARIO OFICIAL EN VIVO (ESPN):\n"
            f"- Partido Real: {m['event']}\n"
            f"- Torneo: {m['league']}\n"
            f"- Kickoff Oficial UTC: {m['kickoff']}\n"
            f"- Estadio: {m['venue']}\n"
            f"- Estado: {m['status']}"
        )
    
    # 2. Búsqueda web complementaria
    web_snippets = search_web_live(f"{team_or_query} ultimas noticias lesiones 2026", max_results=3)
    if web_snippets:
        parts.append("NOTICIAS Y LESIONES EN LA WEB:\n" + "\n".join(f"- {s}" for s in web_snippets))

    if not parts:
        return "Búsqueda web no arrojó resultados adicionales."

    return "\n\n".join(parts)
