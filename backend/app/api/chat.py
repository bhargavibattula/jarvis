import asyncio
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.models.chat import ChatRequest, ChatResponse
from app.models.agent import AgentEvent, AgentName
from app.core.streaming import ws_send_event, ws_send_done, stream_tokens

router = APIRouter()
logger = logging.getLogger(__name__)

# Stub in-memory conversation store
CONVERSATIONS = {}

@router.post("/chat", response_model=ChatResponse)
async def post_chat(request: ChatRequest):
    """
    Synchronous (non-streaming) chat endpoint.
    Used for simple interactions or when streaming is disabled.
    """
    conversation_id = request.conversation_id or str(uuid.uuid4())
    # Stub response
    response_text = f"Hello! This is a stub response for: '{request.message}'. Orchestrator is coming soon."
    
    return ChatResponse(
        message=request.message,
        conversation_id=conversation_id,
        full_response=response_text
    )


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """
    Main WebSocket endpoint for real-time streaming and bidirectional agent communication.
    """
    await websocket.accept()
    logger.info("WebSocket connection established")

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            request = ChatRequest(**data)
            
            conversation_id = request.conversation_id or str(uuid.uuid4())
            
            # 1. Send conversation_id event
            await ws_send_event(websocket, AgentEvent(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                event_type="conversation_id",
                data={"conversation_id": conversation_id},
                timestamp=datetime.now()
            ))

            # 2. Agent Start (Orchestrator)
            await ws_send_event(websocket, AgentEvent(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                event_type="agent_start",
                agent=AgentName.ORCHESTRATOR,
                timestamp=datetime.now()
            ))

            # 3. Simulate thinking / step
            await asyncio.sleep(0.5)
            await ws_send_event(websocket, AgentEvent(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                event_type="agent_step",
                agent=AgentName.ORCHESTRATOR,
                data={"status": "thinking"},
                timestamp=datetime.now()
            ))

            # 4. Stream stub tokens
            async def stub_token_generator():
                tokens = ["This ", "is ", "a ", "stub ", "response. ", "Real ", "Claude ", "integration ", "is ", "in ", "Module ", "2!"]
                for t in tokens:
                    await asyncio.sleep(0.1)
                    yield t

            full_text = await stream_tokens(websocket, conversation_id, stub_token_generator())

            # 5. Send Done
            await ws_send_done(websocket, conversation_id, full_text)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        # Attempt to send error if socket is still open
        try:
            await ws_send_event(websocket, AgentEvent(
                id=str(uuid.uuid4()),
                conversation_id="unknown",
                event_type="error",
                data={"error": str(e)},
                timestamp=datetime.now()
            ))
        except:
            pass
