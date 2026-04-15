import json
import uuid
from datetime import datetime
from typing import Any, AsyncIterator, Dict, Optional

from fastapi import WebSocket
from app.models.agent import AgentEvent, AgentName


async def ws_send_event(websocket: WebSocket, event: AgentEvent):
    """Sends an AgentEvent over WebSocket."""
    await websocket.send_text(event.model_dump_json())


async def ws_send_error(websocket: WebSocket, conversation_id: str, error: str):
    """Sends an error event."""
    event = AgentEvent(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        event_type="error",
        data={"error": error},
        timestamp=datetime.now(),
    )
    await ws_send_event(websocket, event)


async def ws_send_done(websocket: WebSocket, conversation_id: str, full_response: str):
    """Sends a terminal 'done' event."""
    event = AgentEvent(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        event_type="done",
        data={"full_response": full_response},
        timestamp=datetime.now(),
    )
    await ws_send_event(websocket, event)


async def stream_tokens(
    websocket: WebSocket, 
    conversation_id: str, 
    iterator: AsyncIterator[str], 
    agent: AgentName = AgentName.ORCHESTRATOR
):
    """Helper to stream tokens from an async iterator to WebSocket."""
    full_text = ""
    async for chunk in iterator:
        full_text += chunk
        event = AgentEvent(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            event_type="token",
            agent=agent,
            token=chunk,
            timestamp=datetime.now(),
        )
        await ws_send_event(websocket, event)
    return full_text
