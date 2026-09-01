"""Single-instance lock + Telegram compromise guard (PRE-F00 FAIL CLOSED).

Evita conflictos 409 de Telegram por MÚLTIPLES implementaciones polling del mismo
bot (server TS + bots Python) corriendo a la vez: hay exactamente UN propietario
por bot (signals|support).

- Lock dir: <repo>/data/locks por defecto (override: env TELEGRAM_LOCK_DIR).
  El TS (server.ts / app_web/server.ts) usa el MISMO namespace para colisionar.
- Si env TELEGRAM_COMPROMISE_STATUS está activo (!= OK/NONE/FALSE/0), el polling
  queda bloqueado (FAIL CLOSED) — ninguna implementación se conecta al bot.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

# Estados que NUNCA activan el modo comprometido.
_SAFE_STATUSES = {"", "OK", "NONE", "FALSE", "0", "GOOD", "HEALTHY"}


def lock_dir() -> Path:
    override = os.getenv("TELEGRAM_LOCK_DIR", "").strip()
    if override:
        return Path(override)
    # single_instance.py → backend/app/core → parents[3] = raíz del repo
    return Path(__file__).resolve().parents[3] / "data" / "locks"


def telegram_compromised() -> bool:
    status = os.getenv("TELEGRAM_COMPROMISE_STATUS", "OK").strip().upper()
    return status not in _SAFE_STATUSES


def _pid_alive(pid: int) -> bool:
    if not pid or pid <= 0:
        return False
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True  # existe pero pertenece a otro usuario → asumir vivo (no robar)
    except Exception:
        return False


def acquire_poll_lock(name: str) -> bool:
    """Adquiere el lock de polling de `name` (signals|support).

    Lanza RuntimeError si el bot está en modo comprometido (FAIL CLOSED).
    Roba el lock sólo si el dueño murió o está stale (>10 min).
    """
    if telegram_compromised():
        raise RuntimeError(
            "TELEGRAM_COMPROMISE_STATUS activo → FAIL CLOSED: polling bloqueado."
        )
    d = lock_dir()
    d.mkdir(parents=True, exist_ok=True)
    f = d / f".telegram_{name}.lock"
    payload = json.dumps({"pid": os.getpid(), "ts": int(time.time() * 1000)})
    try:
        with open(f, "x", encoding="utf-8") as fh:
            fh.write(payload)
        return True
    except FileExistsError:
        try:
            lock = json.loads(f.read_text(encoding="utf-8"))
            pid = int(lock.get("pid", 0))
            ts = int(lock.get("ts", 0))
            stale = (time.time() * 1000 - ts) > 10 * 60 * 1000
            if not _pid_alive(pid) or stale:
                f.write_text(payload, encoding="utf-8")
                return True
        except Exception:
            pass
        return False


def release_poll_lock(name: str) -> None:
    try:
        (lock_dir() / f".telegram_{name}.lock").unlink()
    except Exception:
        pass