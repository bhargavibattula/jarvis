"""
app/models/chat.py
──────────────────
Pydantic v2 models for chat requests / responses.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class Role(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"
    tool = "tool"


class JarvisMode(str, Enum):
    focus = "focus"       # fast, single-agent, minimal tokens
    research = "research" # multi-agent, deep search, long context
    creative = "creative" # higher temperature, expansive responses


class ChatMessage(BaseModel):
    """A single turn in the conversation history."""

    role: Role
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict] = None


class ChatRequest(BaseModel):
    """Incoming chat payload from the client."""

    message: str = Field(..., min_length=1, max_length=32_000)
    conversation_id: Optional[str] = None
    mode: JarvisMode = JarvisMode.focus
    stream: bool = True
    user_id: str = "default"
    context: Optional[Dict] = None

    @field_validator("message")
    @classmethod
    def strip_message(cls, v: str) -> str:
        return v.strip()


class ChatResponse(BaseModel):
    """Non-streaming HTTP response (used by POST /chat)."""

    conversation_id: str
    message: str
    role: Role = Role.assistant
    mode: JarvisMode
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    agent_trace: Optional[List[Dict]] = None
    memory_used: Optional[List[str]] = None
    tokens_used: Optional[int] = None