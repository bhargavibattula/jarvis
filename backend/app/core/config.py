"""
app/core/config.py
──────────────────
Centralised Pydantic Settings object.
All environment variables are loaded from .env (or the process environment).
Access everywhere via:  from app.core.config import settings
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application-wide configuration loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"
    secret_key: str = "change-me-to-a-random-32-char-string"

    # ── Anthropic ─────────────────────────────────────────────────────────
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-5-sonnet-20240620"
    anthropic_max_tokens: int = 4096

    # ── Groq & Gemini ────────────────────────────────────────────────────
    groq_api_key: str = ""
    gemini_api_key: str = ""

    # ── OpenAI (Voice) ───────────────────────────────────────────────────
    openai_api_key: str = ""
    whisper_model: str = "whisper-1"
    tts_model: str = "tts-1"
    tts_voice: str = "alloy"

    # ── Database ─────────────────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://jarvis:jarvis@localhost:5432/jarvis"
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # ── Redis ────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── Qdrant ───────────────────────────────────────────────────────────
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "jarvis_memory"

    # ── Mem0 ─────────────────────────────────────────────────────────────
    mem0_api_key: str = ""

    # ── Tavily ───────────────────────────────────────────────────────────
    tavily_api_key: str = ""

    # ── E2B ──────────────────────────────────────────────────────────────
    e2b_api_key: str = ""

    # ── Google ───────────────────────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    # ── Finance ──────────────────────────────────────────────────────────
    coingecko_api_key: str = ""

    # ── Weather ──────────────────────────────────────────────────────────
    openweathermap_api_key: str = ""

    # ── News ─────────────────────────────────────────────────────────────
    newsapi_key: str = ""

    # ── CORS ─────────────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    s = Settings()
    logger.info(
        "Settings loaded",
        extra={
            "env": s.app_env,
            "model": s.anthropic_model,
            "qdrant": s.qdrant_url,
        },
    )
    return s


# Singleton – import this everywhere
settings: Settings = get_settings()