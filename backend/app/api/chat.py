"""
app/api/chat.py
────────────────
Chat endpoints:
  POST /chat        – non-streaming (returns full ChatResponse)
  WS   /chat/ws     – streaming WebSocket (yields AgentEvent JSON)
"""
from __future__ import annotations

import json
import logging
import uuid
from typing import Dict

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.core.orchestrator import get_orchestrator
from app.core.streaming import (
    sse_generator,
    ws_send_done,
    ws_send_error,
    ws_send_event,
)
from app.models.agent import AgentEvent, AgentName
from app.models.chat import ChatRequest, ChatResponse, JarvisMode, Role

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


# ── POST /chat (non-streaming) ────────────────────────────────────────────────

@router.post("", response_model=ChatResponse, summary="Send a message (non-streaming)")
async def post_chat(request: ChatRequest) -> ChatResponse:
    """
    Send a message and receive the full response once it's ready.
    For real-time streaming, use the WebSocket endpoint instead.
    """
    orchestrator = get_orchestrator()
    conversation_id = request.conversation_id or str(uuid.uuid4())
    request = ChatRequest(
        message=request.message,
        conversation_id=conversation_id,
        mode=request.mode,
        stream=False,
        user_id=request.user_id,
        context=request.context,
    )

    full_response = ""
    try:
        async for event in orchestrator.run(request):
            if event.event_type == "token" and event.token:
                full_response += event.token
            elif event.event_type == "done" and event.data:
                full_response = event.data.get("full_response", full_response)
                break
            elif event.event_type == "error" and event.data:
                logger.warning("Agent error during POST /chat: %s", event.data)
    except Exception as exc:
        logger.exception("Unhandled error in POST /chat: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    return ChatResponse(
        conversation_id=conversation_id,
        message=full_response or "I encountered an issue processing your request.",
        role=Role.assistant,
        mode=request.mode,
    )


# ── WebSocket /chat/ws ────────────────────────────────────────────────────────

@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket) -> None:
    """
    WebSocket streaming endpoint.

    Client sends:
      { "message": "...", "conversation_id": "...", "mode": "focus", "user_id": "default" }

    Server streams AgentEvent JSON objects, ending with event_type="done".
    """
    await websocket.accept()
    logger.info("WebSocket client connected: %s", websocket.client)

    try:
        while True:
            # ── Receive message ───────────────────────────────────────────
            try:
                raw = await websocket.receive_text()
            except WebSocketDisconnect:
                logger.info("WebSocket client disconnected gracefully")
                break

            # ── Parse request ─────────────────────────────────────────────
            try:
                payload = json.loads(raw)
                request = ChatRequest.model_validate(payload)
            except (json.JSONDecodeError, ValueError) as exc:
                logger.warning("Invalid WebSocket payload: %s | error: %s", raw[:200], exc)
                # We need a conversation_id even for error events
                cid = str(uuid.uuid4())
                await ws_send_error(websocket, cid, f"Invalid request format: {exc}")
                continue

            conversation_id = request.conversation_id or str(uuid.uuid4())
            request = ChatRequest(
                message=request.message,
                conversation_id=conversation_id,
                mode=request.mode,
                stream=True,
                user_id=request.user_id,
                context=request.context,
            )

            # ── Stream events from orchestrator ───────────────────────────
            orchestrator = get_orchestrator()
            try:
                async for event in orchestrator.run(request):
                    await ws_send_event(websocket, event)
            except WebSocketDisconnect:
                logger.info("Client disconnected mid-stream for conversation %s", conversation_id)
                break
            except Exception as exc:
                logger.exception(
                    "Unhandled orchestrator error for conversation %s: %s",
                    conversation_id,
                    exc,
                )
                await ws_send_error(
                    websocket,
                    conversation_id,
                    f"Internal server error: {exc}",
                    agent=AgentName.orchestrator,
                )

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected (outer handler)")
    except Exception as exc:
        logger.exception("Unexpected WebSocket error: %s", exc)
    finally:
        logger.info("WebSocket connection closed: %s", websocket.client)