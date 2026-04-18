"""
app/main.py
────────────
FastAPI application entry point.

Registers:
  - GZip compression middleware
  - CORS middleware
  - Routers: health, chat, voice, memory
  - Lifespan: startup / shutdown hooks
"""
from __future__ import annotations

import logging
import logging.config
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan manager.
    Startup: initialise connections.
    Shutdown: close connections gracefully.
    """
    logger.info("═══ Jarvis backend starting up (env=%s) ═══", settings.app_env)

    # ── Startup ───────────────────────────────────────────────────────────

    # Warm up the orchestrator singleton (creates agent instances)
    from app.core.orchestrator import get_orchestrator
    get_orchestrator()
    logger.info("Orchestrator initialised")

    # TODO: Module 4 – initialise Qdrant client
    # from qdrant_client import AsyncQdrantClient
    # app.state.qdrant = AsyncQdrantClient(url=settings.qdrant_url)

    # TODO: Module 4 – initialise Redis
    # import redis.asyncio as aioredis
    # app.state.redis = await aioredis.from_url(settings.redis_url)

    # TODO: Module 6 – create DB tables (dev only; use Alembic in prod)
    # from app.db.database import engine
    # from app.db.models import Base
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)

    logger.info("═══ Jarvis backend ready ═══")
    yield

    # ── Shutdown ──────────────────────────────────────────────────────────
    logger.info("═══ Jarvis backend shutting down ═══")

    # TODO: Module 4 – close Qdrant
    # await app.state.qdrant.close()

    # TODO: Module 4 – close Redis
    # await app.state.redis.aclose()

    # TODO: Module 6 – dispose DB engine
    # from app.db.database import engine
    # await engine.dispose()

    logger.info("═══ Shutdown complete ═══")


# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Jarvis API",
        description=(
            "Personal AI assistant with agentic capabilities, "
            "persistent memory, voice I/O, and real-time streaming."
        ),
        version="0.2.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── Middleware ────────────────────────────────────────────────────────
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────
    from app.api.health import router as health_router
    from app.api.chat import router as chat_router
    from app.api.voice import router as voice_router
    from app.api.memory import router as memory_router

    app.include_router(health_router)
    app.include_router(chat_router)
    app.include_router(voice_router)
    app.include_router(memory_router)

    logger.info(
        "Registered routers: %s",
        [r.prefix for r in app.routes if hasattr(r, "prefix")],
    )

    return app


# ── App instance ──────────────────────────────────────────────────────────────

app = create_app()