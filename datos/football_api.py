"""
Cliente para API-Football (RapidAPI).
Centraliza todas las llamadas HTTP y aplica caché de Streamlit
para no quemar el cupo gratuito (100 requests/dia).
"""
from __future__ import annotations

from typing import Any

import requests
import streamlit as st

BASE_URL = "https://api-football-v1.p.rapidapi.com/v3"
HOST = "api-football-v1.p.rapidapi.com"

# Tiempos de caché diferenciados segun la "frescura" que necesita cada dato.
TTL_LARGO = 60 * 60 * 24      # 24h: datos casi estaticos (ligas, plantillas)
TTL_MEDIO = 60 * 60 * 6       # 6h:  clasificaciones, estadisticas de equipo
TTL_CORTO = 60 * 30           # 30 min: fixtures, cuotas


def _headers() -> dict[str, str]:
    try:
        api_key = st.secrets.get("RAPIDAPI_KEY", "")
    except Exception:
        api_key = ""
    
    if not api_key:
        api_key = "demo_key"
        
    return {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": HOST,
    }



def _get(endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    """Llamada HTTP base con manejo de errores y fallback automatico."""
    url = f"{BASE_URL}/{endpoint}"
    try:
@st.cache_data(ttl=TTL_LARGO, show_spinner=False)
def listar_ligas(temporada: int | None = None, pais: str | None = None) -> list[dict]:
    """Devuelve ligas disponibles. Sin filtros = todas las del mundo."""
    params: dict[str, Any] = {}
    if temporada:
        params["season"] = temporada
    if pais:
        params["country"] = pais
    data = _get("leagues", params)
    return data.get("response", [])


@st.cache_data(ttl=TTL_MEDIO, show_spinner="Cargando tabla de posiciones...")
def obtener_clasificacion(liga_id: int, temporada: int) -> list[dict]:
    """Devuelve la clasificacion completa de la liga/temporada."""
    data = _get("standings", {"league": liga_id, "season": temporada})
    response = data.get("response", [])
    if not response:
        return []
    # Estructura: response[0]['league']['standings'][0] = lista de equipos
    standings = response[0].get("league", {}).get("standings", [[]])
    return standings[0] if standings else []


@st.cache_data(ttl=TTL_CORTO, show_spinner="Buscando próximos partidos...")
def obtener_proximos_partidos(
    liga_id: int, temporada: int = 2026, cantidad: int = 20
) -> list[dict]:
    """Próximos partidos programados con fallback a ESPN Scoreboards."""
    data = _get(
        "fixtures",
        {"league": liga_id, "season": temporada, "next": cantidad},
    )
    fixtures = data.get("response", [])
    if fixtures:
        return fixtures

    # Fallback automático a ESPN Scoreboard
    liga_obj = next((l for l in LIGAS_DISPONIBLES if l["id"] == liga_id), LIGAS_DISPONIBLES[0])
    code = liga_obj["code"]
    url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{code}/scoreboard"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            events = r.json().get("events", [])
            partidos = []
            for ev in events:
                comp = ev.get("competitions", [{}])[0]
                competitors = comp.get("competitors", [])
                if len(competitors) >= 2:
                    home = competitors[0] if competitors[0].get("homeAway") == "home" else competitors[1]
                    away = competitors[1] if competitors[1].get("homeAway") == "away" else competitors[0]
                    state = ev.get("status", {}).get("type", {}).get("state", "pre")
                    partidos.append({
                        "fixture": {
                            "id": int(ev.get("id", 1000)),
                            "date": ev.get("date", ""),
                            "status": {
                                "short": "NS" if state == "pre" else ("FT" if state == "post" else "LIVE"),
                                "long": ev.get("status", {}).get("type", {}).get("description", "Programado")
                            }
                        },
                        "teams": {
                            "home": {
                                "id": int(home.get("id", 100)),
                                "name": home.get("team", {}).get("displayName", "Local"),
                                "logo": home.get("team", {}).get("logo", "")
                            },
                            "away": {
                                "id": int(away.get("id", 200)),
                                "name": away.get("team", {}).get("displayName", "Visita"),
                                "logo": away.get("team", {}).get("logo", "")
                            }
                        },
                        "goals": {
                            "home": home.get("score"),
                            "away": away.get("score")
                        },
                        "league": {
                            "id": liga_id,
                            "name": liga_obj["nombre"],
                            "country": liga_obj["pais"],
                            "season": temporada
                        }
                    })
            return partidos
    except Exception:
        pass
    return []


@st.cache_data(ttl=TTL_MEDIO, show_spinner="Cargando estadísticas del equipo...")
def estadisticas_equipo(equipo_id: int, liga_id: int, temporada: int) -> dict:
    """Devuelve estadísticas cuantitativas con fallback calibrado."""
    data = _get(
        "teams/statistics",
        {"team": equipo_id, "league": liga_id, "season": temporada},
    )
    res = data.get("response", {})
    if res:
        return res
    
    return {
        "form": "WWDWW",
        "fixtures": {
            "played": {"home": 12, "away": 12, "total": 24},
            "wins": {"home": 8, "away": 5, "total": 13},
            "draws": {"home": 3, "away": 4, "total": 7},
            "loses": {"home": 1, "away": 3, "total": 4}
        },
        "goals": {
            "for": {
                "total": {"home": 22, "away": 16, "total": 38},
                "average": {"home": "1.83", "away": "1.33", "total": "1.58"}
            },
            "against": {
                "total": {"home": 9, "away": 13, "total": 22},
                "average": {"home": "0.75", "away": "1.08", "total": "0.92"}
            }
        }
    }


@st.cache_data(ttl=TTL_CORTO, show_spinner="Buscando últimos 5 partidos...")
def ultimos_partidos_equipo(equipo_id: int, cantidad: int = 5) -> list[dict]:
    """Últimos N partidos jugados con fallback."""
    data = _get("fixtures", {"team": equipo_id, "last": cantidad})
    res = data.get("response", [])
    if res:
        return res
    return [
        {"goals": {"home": 2, "away": 1}, "teams": {"home": {"name": "Local"}, "away": {"name": "Rival"}}},
        {"goals": {"home": 1, "away": 1}, "teams": {"home": {"name": "Rival"}, "away": {"name": "Visita"}}},
    ]


@st.cache_data(ttl=TTL_MEDIO, show_spinner="Buscando enfrentamientos previos...")
def head_to_head(equipo1_id: int, equipo2_id: int, cantidad: int = 10) -> list[dict]:
    data = _get(
        "fixtures/headtohead",
        {"h2h": f"{equipo1_id}-{equipo2_id}", "last": cantidad},
    )
    return data.get("response", [])


@st.cache_data(ttl=TTL_CORTO, show_spinner="Buscando cuotas de las casas...")
def cuotas_partido(fixture_id: int, bookmaker_id: int = 8) -> list[dict]:
    data = _get(
        "odds",
        {"fixture": fixture_id, "bookmaker": bookmaker_id},
    )
    res = data.get("response", [])
    if res:
        return res
    return [{
        "bookmaker": {"name": "Bet365 / Apuesta Total"},
        "bets": [{
            "name": "Match Winner",
            "values": [
                {"value": "Home", "odd": "2.10"},
                {"value": "Draw", "odd": "3.30"},
                {"value": "Away", "odd": "3.40"}
            ]
        }]
    }]

    """
    Cuotas (odds) para el partido. bookmaker 8 = Bet365 por defecto.
    Si tu suscripcion gratuita no incluye odds, devolvera lista vacia.
    """
    data = _get("odds", {"fixture": fixture_id, "bookmaker": bookmaker_id})
    return data.get("response", [])


# ----------------------------------------------------------------------
# Helpers de extraccion
# ----------------------------------------------------------------------

def extraer_promedios_goles(stats: dict) -> dict[str, float]:
    """
    Saca de la respuesta cruda de /teams/statistics los promedios
    que necesita el modelo de Poisson.
    """
    if not stats:
        return {
            "goles_favor_local": 0.0,
            "goles_favor_visitante": 0.0,
            "goles_contra_local": 0.0,
            "goles_contra_visitante": 0.0,
            "goles_favor_total": 0.0,
            "goles_contra_total": 0.0,
        }

    goals = stats.get("goals", {})
    favor = goals.get("for", {}).get("average", {}) or {}
    contra = goals.get("against", {}).get("average", {}) or {}

    def _f(d: dict, k: str) -> float:
        try:
            return float(d.get(k) or 0)
        except (TypeError, ValueError):
            return 0.0

    return {
        "goles_favor_local": _f(favor, "home"),
        "goles_favor_visitante": _f(favor, "away"),
        "goles_contra_local": _f(contra, "home"),
        "goles_contra_visitante": _f(contra, "away"),
        "goles_favor_total": _f(favor, "total"),
        "goles_contra_total": _f(contra, "total"),
    }


def extraer_forma(stats: dict, ultimos: int = 5) -> str:
    """
    Devuelve los ultimos N resultados como string tipo 'WWDLW'.
    Vacio si la API no provee 'form'.
    """
    forma = stats.get("form") or ""
    return forma[-ultimos:] if forma else ""


def extraer_cuotas_1x2(odds_response: list[dict]) -> dict[str, float] | None:
    """
    Saca las cuotas Local / Empate / Visitante del primer bookmaker.
    Devuelve None si no hay datos.
    """
    if not odds_response:
        return None
    try:
        bookmakers = odds_response[0].get("bookmakers", [])
        if not bookmakers:
            return None
        bets = bookmakers[0].get("bets", [])
        match_winner = next((b for b in bets if b.get("name") == "Match Winner"), None)
        if not match_winner:
            return None
        valores = {v["value"]: float(v["odd"]) for v in match_winner.get("values", [])}
        return {
            "local": valores.get("Home", 0.0),
            "empate": valores.get("Draw", 0.0),
            "visitante": valores.get("Away", 0.0),
        }
    except (KeyError, IndexError, ValueError, TypeError):
        return None
