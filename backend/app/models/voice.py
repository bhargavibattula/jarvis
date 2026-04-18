"""
app/models/voice.py
────────────────────
Pydantic v2 models for voice I/O and memory operations.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Memory ────────────────────────────────────────────────────────────────────

class MemoryItem(BaseModel):
    """A single memory record stored in the vector DB."""

    id: Optional[str] = None
    user_id: str = "default"
    content: str
    metadata: Optional[Dict[str, Any]] = None
    score: Optional[float] = None          # relevance score from vector search
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class MemoryQuery(BaseModel):
    """Request payload for memory search."""

    query: str = Field(..., min_length=1)
    user_id: str = "default"
    top_k: int = Field(default=5, ge=1, le=50)
    filters: Optional[Dict[str, Any]] = None


class MemoryCreateRequest(BaseModel):
    """Request payload to store a memory manually."""

    content: str = Field(..., min_length=1)
    user_id: str = "default"
    metadata: Optional[Dict[str, Any]] = None


# ── Voice ─────────────────────────────────────────────────────────────────────

class VoiceRequest(BaseModel):
    """Metadata accompanying an audio upload for transcription."""

    user_id: str = "default"
    language: Optional[str] = None          # ISO 639-1 code, e.g. "en"
    conversation_id: Optional[str] = None
    prompt: Optional[str] = None            # Whisper prompt hint


class VoiceResponse(BaseModel):
    """Result of STT transcription."""

    transcript: str
    language: Optional[str] = None
    duration_seconds: Optional[float] = None
    confidence: Optional[float] = None


class TTSRequest(BaseModel):
    """Request to convert text to speech."""

    text: str = Field(..., min_length=1, max_length=4096)
    voice: str = "alloy"                    # alloy | echo | fable | onyx | nova | shimmer
    model: str = "tts-1"                    # tts-1 | tts-1-hd
    speed: float = Field(default=1.0, ge=0.25, le=4.0)
    response_format: str = "mp3"            # mp3 | opus | aac | flac