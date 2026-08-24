"""
Modelo de Poisson aplicado al futbol.
Calcula probabilidades 1X2, Over/Under y Ambos Anotan (BTTS)
a partir de los goles esperados (xG) de cada equipo.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
from scipy.stats import poisson


@dataclass
class GolesEsperados:
    """Goles esperados (lambda) para local y visitante."""
    local: float
    visitante: float


def calcular_goles_esperados(
    goles_favor_local: float,
    goles_contra_local: float,
    goles_favor_visitante: float,
    goles_contra_visitante: float,
    media_liga_local: float = 1.45,
    media_liga_visitante: float = 1.15,
) -> GolesEsperados:
    """
    Modelo clasico de Dixon-Coles simplificado:
        ataque_local   = (goles favor local del equipo) / (media liga local)
        defensa_visit  = (goles contra visit del rival) / (media liga visit)
        xG_local       = ataque_local * defensa_visit * media_liga_local

    Si no hay datos suficientes, cae a la media de la liga.
    """
    media_liga_local = max(media_liga_local, 0.1)
    media_liga_visitante = max(media_liga_visitante, 0.1)

    ataque_local = (goles_favor_local or media_liga_local) / media_liga_local
    defensa_visit = (goles_contra_visitante or media_liga_visitante) / media_liga_visitante
    xg_local = ataque_local * defensa_visit * media_liga_local

    ataque_visit = (goles_favor_visitante or media_liga_visitante) / media_liga_visitante
    defensa_local = (goles_contra_local or media_liga_local) / media_liga_local
    xg_visit = ataque_visit * defensa_local * media_liga_visitante

    # Cota razonable para evitar valores extremos por datos sucios
    xg_local = float(np.clip(xg_local, 0.1, 5.5))
    xg_visit = float(np.clip(xg_visit, 0.1, 5.5))

    return GolesEsperados(local=round(xg_local, 2), visitante=round(xg_visit, 2))


def matriz_marcadores(xg: GolesEsperados, max_goles: int = 6) -> np.ndarray:
    """
    Devuelve una matriz (max_goles+1)x(max_goles+1) con la probabilidad
    de cada marcador exacto. Filas = goles local, columnas = goles visitante.
    """
    rng = np.arange(0, max_goles + 1)
    p_local = poisson.pmf(rng, xg.local)
    p_visit = poisson.pmf(rng, xg.visitante)
    return np.outer(p_local, p_visit)


def probabilidades_1x2(matriz: np.ndarray) -> dict[str, float]:
    """A partir de la matriz de marcadores, agrega las probabilidades 1 / X / 2."""
    p_local = float(np.tril(matriz, -1).sum())   # local > visit
    p_empate = float(np.trace(matriz))            # diagonal
    p_visit = float(np.triu(matriz, 1).sum())     # visit > local

    total = p_local + p_empate + p_visit
    if total <= 0:
        return {"local": 0.33, "empate": 0.34, "visitante": 0.33}

    return {
        "local": round(p_local / total, 4),
        "empate": round(p_empate / total, 4),
        "visitante": round(p_visit / total, 4),
    }


def probabilidades_over_under(
    matriz: np.ndarray, lineas: Iterable[float] = (0.5, 1.5, 2.5, 3.5, 4.5)
) -> dict[str, dict[str, float]]:
    """Probabilidad de superar (Over) o no (Under) cada linea de goles."""
    n = matriz.shape[0]
    indices_local, indices_visit = np.indices(matriz.shape)
    goles_totales = indices_local + indices_visit

    resultados: dict[str, dict[str, float]] = {}
    for linea in lineas:
        over = float(matriz[goles_totales > linea].sum())
        resultados[str(linea)] = {
            "over": round(over, 4),
            "under": round(1 - over, 4),
        }
    return resultados


def probabilidad_ambos_anotan(matriz: np.ndarray) -> dict[str, float]:
    """Probabilidad de que ambos equipos marquen al menos 1 gol (BTTS)."""
    # BTTS = ambos > 0  =>  fila >= 1 y columna >= 1
    btts = float(matriz[1:, 1:].sum())
    return {"si": round(btts, 4), "no": round(1 - btts, 4)}


def marcador_mas_probable(matriz: np.ndarray) -> tuple[int, int, float]:
    """Marcador exacto con mayor probabilidad."""
    idx = int(np.argmax(matriz))
    fila, col = divmod(idx, matriz.shape[1])
    return fila, col, float(matriz[fila, col])


def top_n_marcadores(matriz: np.ndarray, n: int = 5) -> list[tuple[int, int, float]]:
    """Top N marcadores mas probables ordenados de mayor a menor."""
    plano = matriz.flatten()
    indices = np.argsort(plano)[::-1][:n]
    resultados = []
    for idx in indices:
        fila, col = divmod(int(idx), matriz.shape[1])
        resultados.append((fila, col, round(float(plano[idx]), 4)))
    return resultados


# ---------------- API de alto nivel ---------------------------------

def analisis_completo(
    goles_local: dict[str, float],
    goles_visit: dict[str, float],
    media_liga_local: float = 1.45,
    media_liga_visitante: float = 1.15,
) -> dict:
    """
    Recibe los promedios de goles de ambos equipos y devuelve un dict
    listo para mostrar en UI o pasar al prompt de Gemini.
    """
    xg = calcular_goles_esperados(
        goles_favor_local=goles_local.get("goles_favor_local", 0.0),
        goles_contra_local=goles_local.get("goles_contra_local", 0.0),
        goles_favor_visitante=goles_visit.get("goles_favor_visitante", 0.0),
        goles_contra_visitante=goles_visit.get("goles_contra_visitante", 0.0),
        media_liga_local=media_liga_local,
        media_liga_visitante=media_liga_visitante,
    )

    matriz = matriz_marcadores(xg)
    fila, col, prob = marcador_mas_probable(matriz)

    return {
        "xg": {"local": xg.local, "visitante": xg.visitante},
        "marcador_mas_probable": {
            "local": fila,
            "visitante": col,
            "probabilidad": round(prob, 4),
        },
        "top_marcadores": top_n_marcadores(matriz, n=5),
        "probabilidades_1x2": probabilidades_1x2(matriz),
        "over_under": probabilidades_over_under(matriz),
        "btts": probabilidad_ambos_anotan(matriz),
    }
