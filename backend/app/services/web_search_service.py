"""Servicio de búsqueda web en tiempo real para obtener contexto fresco de partidos."""
from __future__ import annotations

import re
from urllib.parse import quote_plus
import httpx

from backend.app.core.logging import logger

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
}


def search_web_live(query: str, max_results: int = 5) -> list[str]:
    """Realiza una búsqueda web en vivo y devuelve los snippets más relevantes."""
    results: list[str] = []
    try:
        with httpx.Client(timeout=8.0, follow_redirects=True) as client:
            # 1. Intento primario: DuckDuckGo HTML
            r = client.post("https://html.duckduckgo.com/html/", data={"q": query}, headers=HEADERS)
            if r.status_code == 200:
                snippets = re.findall(r'<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', r.text)
                for s in snippets[:max_results]:
                    clean = re.sub(r"<[^<]+?>", "", s).strip()
                    # Desescapar entidades HTML
                    clean = clean.replace("&#x27;", "'").replace("&quot;", '"').replace("&amp;", "&").replace("&#39;", "'")
                    if clean and len(clean) > 20:
                        results.append(clean)
    except Exception as e:
        logger.warning(f"Error en búsqueda web en vivo para '{query}': {e}")

    return results


def build_live_match_context(team_or_query: str) -> str:
    """Busca fixture, fecha, hora, lesiones y forma del partido o equipo."""
    queries = [
        f"proximo partido {team_or_query} 2026 fecha hora estadio",
        f"{team_or_query} ultimos resultados alineacion lesiones futbol 2026",
    ]
    all_snippets = []
    for q in queries:
        snippets = search_web_live(q, max_results=3)
        all_snippets.extend(snippets)

    if not all_snippets:
        return "Búsqueda web no arrojó resultados adicionales."

    unique_snippets = list(dict.fromkeys(all_snippets))
    context = "\n".join(f"- {s}" for s in unique_snippets[:6])
    return f"DATOS EN VIVO ENCONTRADOS EN LA WEB:\n{context}"
