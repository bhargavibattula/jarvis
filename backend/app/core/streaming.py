"""
app/core/streaming.py
──────────────────────
WebSocket and SSE helper utilities.

All helpers accept an AgentEvent-like dict or AgentEvent model and
serialise it as JSON before sending. This keeps the WebSocket handler
layer thin.
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime
from typing import Any, AsyncIterator, Dict, Optional

from fastapi import WebSocket
from fastapi.responses import StreamingResponse

from app.models.agent import AgentEvent, AgentName

logger = logging.getLogger(__name__)


# ── Serialisation helper ─────────────────────────────────────────────────────

def _serialise(event: AgentEvent) -> str:
    """Serialise an AgentEvent to a JSON string, handling datetime objects."""
    return event.model_dump_json()


# ── WebSocket helpers ────────────────────────────────────────────────────────

async def ws_send_event(websocket: WebSocket, event: AgentEvent) -> None:
    """Send a single AgentEvent over a WebSocket connection."""
    try:
        await websocket.send_text(_serialise(event))
    except Exception as exc:
        logger.warning("ws_send_event failed: %s", exc)


async def ws_send_error(
    websocket: WebSocket,
    conversation_id: str,
    message: str,
    agent: Optional[AgentName] = None,
) -> None:
    """Send an error event without crashing the WebSocket connection."""
    event = AgentEvent(
        conversation_id=conversation_id,
        event_type="error",
        agent=agent,
        data={"message": message},
    )
    await ws_send_event(websocket, event)


async def ws_send_done(
    websocket: WebSocket,
    conversation_id: str,
    full_response: str,
    tokens_used: Optional[int] = None,
) -> None:
    """Send the terminal 'done' event."""
    data: Dict[str, Any] = {"full_response": full_response}
    if tokens_used is not None:
        data["tokens_used"] = tokens_used
    event = AgentEvent(
        conversation_id=conversation_id,
        event_type="done",
        data=data,
    )
    await ws_send_event(websocket, event)


async def stream_tokens(
    websocket: WebSocket,
    conversation_id: str,
    token_iter: AsyncIterator[str],
    agent: Optional[AgentName] = None,
) -> str:
    """
    Consume an async iterator of text tokens, send each as an AgentEvent,
    and return the full assembled response string.
    """
    parts: list[str] = []
    async for token in token_iter:
        parts.append(token)
        event = AgentEvent(
            conversation_id=conversation_id,
            event_type="token",
            agent=agent,
            token=token,
        )
        await ws_send_event(websocket, event)
    return "".join(parts)


# ── SSE helpers (for POST /chat non-WebSocket streaming) ────────────────────

def make_sse_line(event: AgentEvent) -> str:
    """Format an AgentEvent as an SSE data line."""
    return f"data: {_serialise(event)}\n\n"


async def sse_generator(
    event_iter: AsyncIterator[AgentEvent],
) -> AsyncIterator[str]:
    """Convert an AgentEvent async iterator into SSE text lines."""
    async for event in event_iter:
        yield make_sse_line(event)