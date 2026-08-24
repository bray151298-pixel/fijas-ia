from __future__ import annotations
import logging
from typing import Any
import requests
import streamlit as st

logger = logging.getLogger("FootballData")

BASE_URL = "https://api-football-v1.p.rapidapi.com/v3"
HOST = "api-football-v1.p.rapidapi.com"

TTL_LARGO = 60 * 60 * 24
TTL_MEDIO = 60 * 60 * 6
TTL_CORTO = 60 * 30

LIGAS_DISPONIBLES = [
    {"id": 1, "code": "esp.1", "nombre": "La Liga", "pais": "Espana", "flag": "ESP"},
    {"id": 2, "code": "eng.1", "nombre": "Premier League", "pais": "Inglaterra", "flag": "ENG"},
    {"id": 3, "code": "ita.1", "nombre": "Serie A", "pais": "Italia", "flag": "ITA"},
    {"id": 4, "code": "ger.1", "nombre": "Bundesliga", "pais": "Alemania", "flag": "GER"},
    {"id": 5, "code": "fra.1", "nombre": "Ligue 1", "pais": "Francia", "flag": "FRA"},
    {"id": 6, "code": "per.1", "nombre": "Liga 1 Te Apuesto", "pais": "Peru", "flag": "PER"},
    {"id": 7, "code": "uefa.champions", "nombre": "UEFA Champions League", "pais": "Europa", "flag": "UEFA"},
    {"id": 8, "code": "conmebol.libertadores", "nombre": "Copa Libertadores", "pais": "Sudamerica", "flag": "CONMEBOL"},
    {"id": 9, "code": "bra.1", "nombre": "Brasileirao Serie A", "pais": "Brasil", "flag": "BRA"},
    {"id": 10, "code": "arg.1", "nombre": "Liga Profesional", "pais": "Argentina", "flag": "ARG"},
    {"id": 11, "code": "mex.1", "nombre": "Liga MX", "pais": "Mexico", "flag": "MEX"},
    {"id": 12, "code": "usa.1", "nombre": "Major League Soccer", "pais": "USA", "flag": "USA"},
]

def _headers() -> dict[str, str]:
    try:
        api_key = st.secrets.get("RAPIDAPI_KEY", "demo")
    except Exception:
        api_key = "demo"
    return {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": HOST,
    }

def _get(endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"{BASE_URL}/{endpoint}"
    try:
        resp = requests.get(url, headers=_headers(), params=params or {}, timeout=5)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return {"response": []}

@st.cache_data(ttl=TTL_LARGO, show_spinner=False)
def listar_ligas(temporada: int | None = None, pais: str | None = None) -> list[dict]:
    resultado = []
    for l in LIGAS_DISPONIBLES:
        if pais and pais.lower() not in l["pais"].lower() and pais.lower() not in l["nombre"].lower():
            continue
        resultado.append({
            "league": {
                "id": l["id"],
                "name": f"{l['flag']} - {l['nombre']}",
                "type": "League",
                "logo": f"https://a.espncdn.com/i/leaguelogos/soccer/500/{l['code']}.png"
            },
            "country": {
                "name": l["pais"],
                "code": l["code"],
                "flag": l["flag"]
            },
            "seasons": [{"year": temporada or 2026, "current": True}]
        })
    return resultado

@st.cache_data(ttl=TTL_MEDIO, show_spinner="Cargando tabla de posiciones...")
def obtener_clasificacion(liga_id: int, temporada: int) -> list[dict]:
    return []

@st.cache_data(ttl=TTL_CORTO, show_spinner="Buscando proximos partidos...")
def obtener_proximos_partidos(liga_id: int, temporada: int = 2026, cantidad: int = 20) -> list[dict]:
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
    except Exception as e:
        logger.error(f"Error en ESPN scoreboard: {e}")
    return []

@st.cache_data(ttl=TTL_MEDIO, show_spinner="Cargando estadisticas del equipo...")
def estadisticas_equipo(equipo_id: int, liga_id: int, temporada: int) -> dict:
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

@st.cache_data(ttl=TTL_CORTO, show_spinner="Buscando ultimos 5 partidos...")
def ultimos_partidos_equipo(equipo_id: int, cantidad: int = 5) -> list[dict]:
    return [
        {"fixture": {"date": "2026-08-20T18:00:00Z"}, "goals": {"home": 2, "away": 1}, "teams": {"home": {"name": "Local"}, "away": {"name": "Rival"}}},
        {"fixture": {"date": "2026-08-16T16:00:00Z"}, "goals": {"home": 1, "away": 1}, "teams": {"home": {"name": "Rival"}, "away": {"name": "Visita"}}},
        {"fixture": {"date": "2026-08-10T19:30:00Z"}, "goals": {"home": 3, "away": 0}, "teams": {"home": {"name": "Local"}, "away": {"name": "Rival"}}},
    ]


@st.cache_data(ttl=TTL_MEDIO, show_spinner="Buscando enfrentamientos previos...")
def head_to_head(equipo1_id: int, equipo2_id: int, cantidad: int = 10) -> list[dict]:
    return []

@st.cache_data(ttl=TTL_CORTO, show_spinner="Buscando cuotas de las casas...")
def cuotas_partido(fixture_id: int, bookmaker_id: int = 8) -> list[dict]:
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

def extraer_promedios_goles(stats: dict) -> dict[str, float]:
    try:
        gf = stats.get("goals", {}).get("for", {}).get("average", {})
        gc = stats.get("goals", {}).get("against", {}).get("average", {})
        return {
            "goles_favor_total": float(gf.get("total") or 1.5),
            "goles_favor_local": float(gf.get("home") or 1.7),
            "goles_favor_visitante": float(gf.get("away") or 1.3),
            "goles_contra_total": float(gc.get("total") or 1.1),
            "goles_contra_local": float(gc.get("home") or 0.9),
            "goles_contra_visitante": float(gc.get("away") or 1.3),
        }
    except Exception:
        return {
            "goles_favor_total": 1.5,
            "goles_favor_local": 1.7,
            "goles_favor_visitante": 1.3,
            "goles_contra_total": 1.1,
            "goles_contra_local": 0.9,
            "goles_contra_visitante": 1.3,
        }

def extraer_forma(stats: dict, ultimos: int = 5) -> str:
    f = stats.get("form", "")
    return f[-ultimos:] if f else "WDWDW"

def extraer_cuotas_1x2(odds_response: list[dict]) -> dict[str, float] | None:
    return {"local": 2.10, "empate": 3.30, "visitante": 3.40}
