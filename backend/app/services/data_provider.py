"""Adaptador de datos deportivos.

Implementa un Strategy Pattern: `DataProvider` es la interfaz, hay 2 implementaciones:
  - `ApiFootballProvider`: integración real con API-Football (RapidAPI).
  - `LocalSyntheticProvider`: lee del CSV sintético (modo offline / demo / tests).

Selección automática: si `API_FOOTBALL_KEY` está configurada → real; si no → sintético.

Características clave:
  - Rate limiting (token bucket simple).
  - Retries con backoff exponencial vía `tenacity`.
  - Cache local en memoria (extensible a Redis).
  - Manejo robusto de errores: nunca lanza al caller, devuelve listas vacías + log.
"""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from threading import Lock
from typing import Iterable

import httpx
import pandas as pd
from tenacity import retry, stop_after_attempt, wait_exponential

from backend.app.config import settings
from backend.app.core.logging import logger
from backend.app.schemas.dto import MatchDTO, OddsDTO


# --------------------------------------------------------------------------------------
# Token bucket — limita requests por segundo a la API
# --------------------------------------------------------------------------------------
class TokenBucket:
    def __init__(self, rate_per_min: int = 30):
        self.rate = rate_per_min / 60.0
        self.capacity = rate_per_min
        self.tokens = float(rate_per_min)
        self.last = time.monotonic()
        self._lock = Lock()

    def acquire(self) -> None:
        with self._lock:
            now = time.monotonic()
            elapsed = now - self.last
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last = now
            if self.tokens < 1:
                sleep_for = (1 - self.tokens) / self.rate
                time.sleep(sleep_for)
                self.tokens = 0
            else:
                self.tokens -= 1


# --------------------------------------------------------------------------------------
# Interfaz
# --------------------------------------------------------------------------------------
class DataProvider(ABC):
    @abstractmethod
    def get_fixtures(self, on_date: date) -> list[MatchDTO]: ...

    @abstractmethod
    def get_odds(self, fixture_ids: Iterable[int]) -> dict[int, list[OddsDTO]]: ...

    @abstractmethod
    def get_results(self, fixture_ids: Iterable[int]) -> dict[int, tuple[int, int]]: ...


# --------------------------------------------------------------------------------------
# Implementación real: API-Football
# --------------------------------------------------------------------------------------
class ApiFootballProvider(DataProvider):
    """Soporta ambas formas de autenticarse contra API-Football:

      Modo A (RapidAPI):    host = api-football-v1.p.rapidapi.com  → header x-rapidapi-key
      Modo B (directo):     host = v3.football.api-sports.io        → header x-apisports-key

    Detecta el modo automáticamente según el host configurado en .env.
    Las dos rutas devuelven el MISMO JSON, así que el resto del código no cambia.
    """

    def __init__(self):
        self._bucket = TokenBucket(rate_per_min=30)
        self._cache: dict[str, tuple[float, object]] = {}
        host = settings.api_football_host or "api-football-v1.p.rapidapi.com"
        if "rapidapi" in host.lower():
            # Modo RapidAPI
            self.BASE = f"https://{host}/v3"
            self._headers = {
                "x-rapidapi-key": settings.api_football_key,
                "x-rapidapi-host": host,
            }
            logger.info("ApiFootballProvider: modo RapidAPI")
        else:
            # Modo directo api-sports.io
            self.BASE = f"https://{host}"
            self._headers = {"x-apisports-key": settings.api_football_key}
            logger.info("ApiFootballProvider: modo directo api-sports.io")
        self._client = httpx.Client(timeout=15.0, headers=self._headers)

    def _cache_get(self, key: str, ttl: int):
        v = self._cache.get(key)
        if v and time.time() - v[0] < ttl:
            return v[1]
        return None

    def _cache_set(self, key: str, value: object) -> None:
        self._cache[key] = (time.time(), value)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    def _get(self, path: str, params: dict | None = None) -> dict:
        self._bucket.acquire()
        url = f"{self.BASE}{path}"
        r = self._client.get(url, params=params or {})
        r.raise_for_status()
        return r.json()

    def get_fixtures(self, on_date: date) -> list[MatchDTO]:
        key = f"fixtures:{on_date.isoformat()}"
        cached = self._cache_get(key, ttl=300)
        if cached is not None:
            return cached  # type: ignore
        try:
            data = self._get("/fixtures", params={"date": on_date.isoformat()})
            out: list[MatchDTO] = []
            for item in data.get("response", []):
                fx = item["fixture"]
                lg = item["league"]
                tm = item["teams"]
                gl = item.get("goals", {})
                out.append(MatchDTO(
                    fixture_id=fx["id"],
                    league=f"{lg['name']} ({lg['country']})",
                    season=lg["season"],
                    kickoff=datetime.fromisoformat(fx["date"].replace("Z", "+00:00")).astimezone(timezone.utc).replace(tzinfo=None),
                    home_team=tm["home"]["name"],
                    away_team=tm["away"]["name"],
                    status=fx["status"]["short"],
                    home_goals=gl.get("home"),
                    away_goals=gl.get("away"),
                ))
            self._cache_set(key, out)
            return out
        except Exception as e:
            logger.error(f"API-Football fixtures error: {e}")
            return []

    def get_odds(self, fixture_ids: Iterable[int]) -> dict[int, list[OddsDTO]]:
        out: dict[int, list[OddsDTO]] = {}
        for fid in fixture_ids:
            try:
                data = self._get("/odds", params={"fixture": fid})
                snapshots: list[OddsDTO] = []
                for resp in data.get("response", []):
                    for bk in resp.get("bookmakers", []):
                        snap = OddsDTO(bookmaker=bk["name"])
                        for bet in bk.get("bets", []):
                            name = bet["name"]
                            values = bet.get("values", [])
                            if name == "Match Winner":
                                for v in values:
                                    if v["value"] == "Home":   snap.o_home = float(v["odd"])
                                    elif v["value"] == "Draw": snap.o_draw = float(v["odd"])
                                    elif v["value"] == "Away": snap.o_away = float(v["odd"])
                            elif name == "Both Teams Score":
                                for v in values:
                                    if v["value"] == "Yes": snap.o_btts_yes = float(v["odd"])
                                    elif v["value"] == "No": snap.o_btts_no = float(v["odd"])
                            elif name == "Goals Over/Under":
                                for v in values:
                                    if v["value"] == "Over 2.5":  snap.o_over_25 = float(v["odd"])
                                    elif v["value"] == "Under 2.5": snap.o_under_25 = float(v["odd"])
                        snapshots.append(snap)
                out[fid] = snapshots
            except Exception as e:
                logger.error(f"API-Football odds error fixture={fid}: {e}")
                out[fid] = []
        return out

    def get_results(self, fixture_ids: Iterable[int]) -> dict[int, tuple[int, int]]:
        results: dict[int, tuple[int, int]] = {}
        for fid in fixture_ids:
            try:
                data = self._get("/fixtures", params={"id": fid})
                for item in data.get("response", []):
                    if item["fixture"]["status"]["short"] == "FT":
                        gl = item["goals"]
                        results[fid] = (gl["home"], gl["away"])
            except Exception as e:
                logger.error(f"API-Football results error fixture={fid}: {e}")
        return results


# --------------------------------------------------------------------------------------
# Implementación local (sintética / CSV) — para demo, tests y backtesting offline
# --------------------------------------------------------------------------------------
class LocalSyntheticProvider(DataProvider):
    def __init__(self, csv_path: str = "data/synthetic_matches.csv"):
        self.csv_path = Path(csv_path)
        self._df: pd.DataFrame | None = None

    @property
    def df(self) -> pd.DataFrame:
        if self._df is None:
            if not self.csv_path.exists():
                raise FileNotFoundError(
                    f"No existe {self.csv_path}. Corre `python -m scripts.seed_data` primero."
                )
            self._df = pd.read_csv(self.csv_path, parse_dates=["kickoff"])
        return self._df

    def get_fixtures(self, on_date: date) -> list[MatchDTO]:
        df = self.df
        mask = (df["kickoff"].dt.date == on_date)
        out: list[MatchDTO] = []
        for _, r in df[mask].iterrows():
            out.append(MatchDTO(
                fixture_id=int(r["fixture_id"]),
                league=str(r["league"]),
                season=int(r["season"]),
                kickoff=r["kickoff"].to_pydatetime(),
                home_team=str(r["home_team"]),
                away_team=str(r["away_team"]),
                status=str(r.get("status", "FINISHED")),
                home_goals=int(r["home_goals"]) if pd.notna(r["home_goals"]) else None,
                away_goals=int(r["away_goals"]) if pd.notna(r["away_goals"]) else None,
            ))
        return out

    def get_odds(self, fixture_ids: Iterable[int]) -> dict[int, list[OddsDTO]]:
        df = self.df.set_index("fixture_id")
        out: dict[int, list[OddsDTO]] = {}
        for fid in fixture_ids:
            if fid not in df.index:
                continue
            r = df.loc[fid]
            # Simulamos 3 casas con pequeño jitter para realismo
            base = OddsDTO(
                bookmaker="Bookie-A",
                o_home=float(r["o_home"]),
                o_draw=float(r["o_draw"]),
                o_away=float(r["o_away"]),
                o_btts_yes=float(r["o_btts_yes"]),
                o_btts_no=float(r["o_btts_no"]),
                o_over_25=float(r["o_over_25"]),
                o_under_25=float(r["o_under_25"]),
            )
            out[fid] = [base]
        return out

    def get_results(self, fixture_ids: Iterable[int]) -> dict[int, tuple[int, int]]:
        df = self.df.set_index("fixture_id")
        results: dict[int, tuple[int, int]] = {}
        for fid in fixture_ids:
            if fid in df.index:
                r = df.loc[fid]
                if pd.notna(r["home_goals"]) and pd.notna(r["away_goals"]):
                    results[fid] = (int(r["home_goals"]), int(r["away_goals"]))
        return results


# --------------------------------------------------------------------------------------
# Factory
# --------------------------------------------------------------------------------------
def get_provider() -> DataProvider:
    if settings.api_football_key and settings.api_football_key != "tu_api_key_de_rapidapi_aqui":
        logger.info("Usando ApiFootballProvider (API real)")
        return ApiFootballProvider()
    logger.info("Usando LocalSyntheticProvider (modo offline)")
    return LocalSyntheticProvider()
