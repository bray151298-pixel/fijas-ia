"""
Analisis de Valor (Value Betting).
Compara la probabilidad calculada por nuestro modelo (Poisson + IA)
contra la probabilidad implicita en la cuota del bookmaker.

Formula clave:
    EV (Expected Value) = (probabilidad_real * cuota) - 1

Si EV > 0  => apuesta con valor positivo (+EV).
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class OportunidadValor:
    mercado: str          # "Local" / "Empate" / "Visitante" / etc.
    cuota: float          # cuota del bookmaker (formato decimal europeo)
    prob_modelo: float    # probabilidad estimada por nuestro modelo (0-1)
    prob_implicita: float # probabilidad implicita en la cuota
    valor_esperado: float # EV = (prob_modelo * cuota) - 1
    edge: float           # diferencia (prob_modelo - prob_implicita), en %


def probabilidad_implicita(cuota: float) -> float:
    """Convierte cuota decimal a probabilidad (sin descontar margen del bookie)."""
    if cuota <= 1:
        return 0.0
    return round(1 / cuota, 4)


def evaluar_apuesta(prob_modelo: float, cuota: float) -> dict[str, float]:
    """
    Devuelve EV y edge de una apuesta concreta.
        EV positivo => valor a favor del apostador.
    """
    if cuota <= 1 or prob_modelo <= 0:
        return {"valor_esperado": -1.0, "edge_pct": 0.0, "prob_implicita": 0.0}

    prob_imp = 1 / cuota
    ev = (prob_modelo * cuota) - 1
    edge = (prob_modelo - prob_imp) * 100

    return {
        "valor_esperado": round(ev, 4),
        "edge_pct": round(edge, 2),
        "prob_implicita": round(prob_imp, 4),
    }


def buscar_oportunidades_1x2(
    probabilidades_modelo: dict[str, float],
    cuotas: dict[str, float],
    umbral_ev: float = 0.05,
) -> list[OportunidadValor]:
    """
    Recorre los tres mercados (1, X, 2) y devuelve las apuestas
    cuyo Expected Value supera el umbral (por defecto 5%).
    """
    mapping = {
        "local": "Local (1)",
        "empate": "Empate (X)",
        "visitante": "Visitante (2)",
    }

    oportunidades: list[OportunidadValor] = []
    for clave, etiqueta in mapping.items():
        cuota = cuotas.get(clave, 0.0)
        prob = probabilidades_modelo.get(clave, 0.0)
        if cuota <= 1 or prob <= 0:
            continue

        ev = (prob * cuota) - 1
        if ev >= umbral_ev:
            oportunidades.append(
                OportunidadValor(
                    mercado=etiqueta,
                    cuota=round(cuota, 2),
                    prob_modelo=round(prob, 4),
                    prob_implicita=round(1 / cuota, 4),
                    valor_esperado=round(ev, 4),
                    edge=round((prob - 1 / cuota) * 100, 2),
                )
            )

    # Ordena por mejor EV primero
    oportunidades.sort(key=lambda x: x.valor_esperado, reverse=True)
    return oportunidades


def margen_bookie(cuotas: dict[str, float]) -> float:
    """
    Calcula el 'overround' (margen de la casa).
    Suma de probabilidades implicitas - 1, en %.
    Tipico: 4-8 % en casas grandes.
    """
    total = sum(1 / c for c in cuotas.values() if c > 1)
    return round((total - 1) * 100, 2)


def kelly_fraccion(prob_modelo: float, cuota: float, fraccion: float = 0.25) -> float:
    """
    Criterio de Kelly fraccional para tamano de apuesta sugerido,
    como % del bankroll. Por defecto Kelly cuarto (mas conservador).

    Si devuelve 0 o negativo => NO apostar.
    """
    if cuota <= 1 or prob_modelo <= 0 or prob_modelo >= 1:
        return 0.0
    b = cuota - 1
    q = 1 - prob_modelo
    kelly = (prob_modelo * b - q) / b
    if kelly <= 0:
        return 0.0
    return round(kelly * fraccion * 100, 2)
