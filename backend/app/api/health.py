"""
app/api/health.py
──────────────────
Health check endpoints.
GET /health        – liveness probe
GET /health/ready  – readiness probe (checks critical dependencies)
"""
from __future__ import annotations

import logging
import time
from typing import Dict

from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])

_start_time = time.time()


@router.get("", summary="Liveness check")
async def health() -> Dict:
    """Returns 200 if the app is alive."""
    return {
        "status": "ok",
        "uptime_seconds": round(time.time() - _start_time, 1),
    }


@router.get("/ready", summary="Readiness check")
async def health_ready() -> Dict:
    """
    Returns 200 if the app is ready to serve traffic.
    Checks config loading; actual DB / Qdrant pings added in Module 4+.
    """
    from app.core.config import settings

    checks: Dict[str, str] = {}

    # Anthropic key present
    checks["anthropic"] = "configured" if settings.anthropic_api_key else "missing"

    # TODO: Module 4 – ping Qdrant
    checks["qdrant"] = "not_checked"

    # TODO: Module 4 – ping Redis
    checks["redis"] = "not_checked"

    # TODO: Module 6 – ping Postgres
    checks["postgres"] = "not_checked"

    all_ok = checks["anthropic"] == "configured"
    return {
        "status": "ready" if all_ok else "degraded",
        "checks": checks,
    }