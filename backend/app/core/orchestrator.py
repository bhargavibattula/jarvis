"""
app/core/orchestrator.py
─────────────────────────
LangGraph-based orchestrator for Jarvis.

Responsibilities:
  1. Classify the user's intent and select the appropriate agent(s).
  2. Read relevant memories from Qdrant before the LLM call.
  3. Stream real Claude tokens, delegating to sub-agents as needed.
  4. Write new memories after the turn.
  5. Yield AgentEvent objects as an async generator consumed by
     the WebSocket handler.

Graph nodes:
  classify → [route to agent] → synthesise → write_memory

All LLM calls use the Anthropic streaming API.
"""
from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Any, AsyncIterator, Dict, List, Optional

import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from app.agents.base_agent import BaseAgent
from app.agents.coder_agent import CoderAgent
from app.agents.email_agent import EmailAgent
from app.agents.calendar_agent import CalendarAgent
from app.agents.drive_agent import DriveAgent
from app.agents.finance_agent import FinanceAgent
from app.agents.news_agent import NewsAgent
from app.agents.search_agent import SearchAgent
from app.agents.weather_agent import WeatherAgent
from app.core.config import settings
from app.models.agent import AgentEvent, AgentName, AgentStatus
from app.models.chat import ChatRequest, JarvisMode

logger = logging.getLogger(__name__)

# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """You are Jarvis, a highly capable personal AI assistant. You are:
- Intelligent, precise, and helpful
- Able to search the web, check weather, fetch financial data, read news,
  write and execute code, manage emails, calendar, and Google Drive
- Aware of the user's conversation history and personal context from memory
- Proactive: you suggest relevant information the user might want
- Concise but thorough: you avoid waffle, but never sacrifice accuracy

When answering:
- Use available memory context to personalise your response
- Be conversational and natural, not robotic
- For factual questions, always note if you're working from memory vs. real-time data
- Format responses with markdown when helpful (lists, code blocks, bold for key info)
"""

_CLASSIFICATION_PROMPT = """You are a routing classifier for Jarvis AI. 
Given a user message, respond with ONLY a JSON object like:
{
  "intent": "one of: general | weather | search | finance | news | code | email | calendar | drive",
  "agent": "one of: null | weather | search | finance | news | coder | email | calendar | drive",
  "reason": "brief reason for routing decision",
  "needs_realtime": true/false,
  "entities": ["list", "of", "key", "entities"]
}

Route to an agent only when the query clearly needs that capability:
- weather: weather conditions, forecasts, temperature
- search: current events, facts, web research
- finance: stock prices, crypto, market data
- news: headlines, news articles, current events
- coder: write code, run code, algorithms, calculations, data analysis
- email: read/send Gmail, email management
- calendar: calendar events, scheduling, Google Calendar
- drive: Google Drive files, documents
- general: conversation, general knowledge, reasoning (NO agent needed)

Respond ONLY with the JSON object, no other text."""


# ── In-memory conversation store (replaced by Redis in Module 6) ──────────────

_conversations: Dict[str, List[Dict]] = {}


# ── Orchestrator ──────────────────────────────────────────────────────────────

class Orchestrator:
    """
    LangGraph-based orchestrator that routes requests to the right agent
    and streams back AgentEvent objects.
    """

    def __init__(self) -> None:
        self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self._agents: Dict[AgentName, BaseAgent] = {
            AgentName.weather: WeatherAgent(),
            AgentName.search: SearchAgent(),
            AgentName.finance: FinanceAgent(),
            AgentName.news: NewsAgent(),
            AgentName.coder: CoderAgent(),
            AgentName.email: EmailAgent(),
            AgentName.calendar: CalendarAgent(),
            AgentName.drive: DriveAgent(),
        }
        logger.info("Orchestrator initialised with %d agents", len(self._agents))

    # ── Public entry point ────────────────────────────────────────────────

    async def run(self, request: ChatRequest) -> AsyncIterator[AgentEvent]:
        """
        Main async generator. Yields AgentEvent objects for the WebSocket
        handler to forward to the client.
        """
        conversation_id = request.conversation_id or str(uuid.uuid4())
        t0 = time.monotonic()

        # 1. Emit conversation_id immediately so client can track the session
        yield AgentEvent(
            conversation_id=conversation_id,
            event_type="conversation_id",
            agent=AgentName.orchestrator,
            data={"conversation_id": conversation_id},
        )

        # 2. Orchestrator starts
        yield AgentEvent(
            conversation_id=conversation_id,
            event_type="agent_start",
            agent=AgentName.orchestrator,
            data={"mode": request.mode.value},
        )

        # 3. Read memory
        memories = await self._read_memory(
            user_id=request.user_id,
            query=request.message,
            conversation_id=conversation_id,
        )
        if memories:
            yield AgentEvent(
                conversation_id=conversation_id,
                event_type="memory_read",
                agent=AgentName.orchestrator,
                data={"memories": memories},
            )

        # 4. Get conversation history
        history = _conversations.get(conversation_id, [])

        # 5. Classify intent → route to agent or handle directly
        classification = await self._classify(request.message)
        logger.info(
            "Classified message",
            extra={"intent": classification.get("intent"), "agent": classification.get("agent")},
        )

        agent_name_str: Optional[str] = classification.get("agent")
        full_response = ""

        if agent_name_str and agent_name_str != "null":
            # ── Delegate to a sub-agent ───────────────────────────────────
            try:
                agent_name = AgentName(agent_name_str)
                agent = self._agents[agent_name]
                context = {
                    "conversation_id": conversation_id,
                    "user_id": request.user_id,
                    "mode": request.mode.value,
                    "history": history,
                    "memories": memories,
                }
                token_parts: List[str] = []
                async for event in agent.run(input=request.message, context=context):
                    # Collect tokens for memory writing
                    if event.event_type == "token" and event.token:
                        token_parts.append(event.token)
                    yield event
                full_response = "".join(token_parts)
            except (KeyError, ValueError) as exc:
                logger.error("Agent routing failed: %s", exc)
                yield AgentEvent(
                    conversation_id=conversation_id,
                    event_type="error",
                    agent=AgentName.orchestrator,
                    data={"message": f"Agent routing error: {exc}"},
                )
                # Fall through to direct Claude response
                full_response = await self._direct_response(
                    request=request,
                    conversation_id=conversation_id,
                    history=history,
                    memories=memories,
                )
        else:
            # ── Direct Claude response (no agent needed) ──────────────────
            async for token_event in self._stream_direct_response(
                request=request,
                conversation_id=conversation_id,
                history=history,
                memories=memories,
            ):
                if token_event.event_type == "token" and token_event.token:
                    full_response += token_event.token
                yield token_event

        # 6. Update conversation history
        _conversations.setdefault(conversation_id, [])
        _conversations[conversation_id].append(
            {"role": "user", "content": request.message}
        )
        if full_response:
            _conversations[conversation_id].append(
                {"role": "assistant", "content": full_response}
            )
        # Keep last 20 turns
        if len(_conversations[conversation_id]) > 40:
            _conversations[conversation_id] = _conversations[conversation_id][-40:]

        # 7. Write memory
        await self._write_memory(
            user_id=request.user_id,
            message=request.message,
            response=full_response,
            conversation_id=conversation_id,
        )
        if full_response:
            yield AgentEvent(
                conversation_id=conversation_id,
                event_type="memory_write",
                agent=AgentName.orchestrator,
                data={"stored": True},
            )

        # 8. Done
        duration_ms = (time.monotonic() - t0) * 1000
        yield AgentEvent(
            conversation_id=conversation_id,
            event_type="done",
            agent=AgentName.orchestrator,
            data={
                "full_response": full_response,
                "duration_ms": round(duration_ms, 1),
                "conversation_id": conversation_id,
            },
        )

    # ── Classification ────────────────────────────────────────────────────

    async def _classify(self, message: str) -> Dict[str, Any]:
        """Use Claude to classify the user's intent and choose an agent."""
        try:
            response = self._client.messages.create(
                model=settings.anthropic_model,
                max_tokens=256,
                system=_CLASSIFICATION_PROMPT,
                messages=[{"role": "user", "content": message}],
            )
            raw = response.content[0].text.strip()
            # Strip markdown fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except (json.JSONDecodeError, IndexError, anthropic.APIError) as exc:
            logger.warning("Classification failed, defaulting to general: %s", exc)
            return {"intent": "general", "agent": None, "reason": "classification error"}

    # ── Direct streaming response ─────────────────────────────────────────

    async def _stream_direct_response(
        self,
        request: ChatRequest,
        conversation_id: str,
        history: List[Dict],
        memories: List[str],
    ) -> AsyncIterator[AgentEvent]:
        """Stream a direct Claude response (no agent delegation)."""
        messages = self._build_messages(
            message=request.message,
            history=history,
            memories=memories,
        )
        system = self._build_system_prompt(request.mode, memories)

        try:
            with self._client.messages.stream(
                model=settings.anthropic_model,
                max_tokens=settings.anthropic_max_tokens,
                system=system,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    yield AgentEvent(
                        conversation_id=conversation_id,
                        event_type="token",
                        agent=AgentName.orchestrator,
                        token=text,
                    )
        except anthropic.APIError as exc:
            logger.error("Direct response streaming failed: %s", exc)
            yield AgentEvent(
                conversation_id=conversation_id,
                event_type="error",
                agent=AgentName.orchestrator,
                data={"message": f"Streaming error: {exc}"},
            )

    async def _direct_response(
        self,
        request: ChatRequest,
        conversation_id: str,
        history: List[Dict],
        memories: List[str],
    ) -> str:
        """Non-streaming direct response (fallback). Returns full text."""
        messages = self._build_messages(request.message, history, memories)
        system = self._build_system_prompt(request.mode, memories)
        try:
            response = self._client.messages.create(
                model=settings.anthropic_model,
                max_tokens=settings.anthropic_max_tokens,
                system=system,
                messages=messages,
            )
            return response.content[0].text
        except anthropic.APIError as exc:
            logger.error("Direct response failed: %s", exc)
            return f"I encountered an error: {exc}"

    # ── Memory ────────────────────────────────────────────────────────────

    async def _read_memory(
        self, user_id: str, query: str, conversation_id: str
    ) -> List[str]:
        """
        Retrieve relevant memories from Qdrant via Mem0.
        TODO: Module 4 – wire up real Mem0 + Qdrant integration.
        Returns a list of memory strings.
        """
        try:
            # TODO: Module 4 – replace with actual Mem0 search
            # from mem0 import Memory
            # m = Memory()
            # results = m.search(query, user_id=user_id)
            # return [r["memory"] for r in results.get("results", [])]
            return []
        except Exception as exc:
            logger.warning("Memory read failed: %s", exc)
            return []

    async def _write_memory(
        self, user_id: str, message: str, response: str, conversation_id: str
    ) -> None:
        """
        Store the turn in Qdrant via Mem0.
        TODO: Module 4 – wire up real Mem0 + Qdrant integration.
        """
        try:
            # TODO: Module 4 – replace with actual Mem0 add
            # from mem0 import Memory
            # m = Memory()
            # m.add(
            #     [{"role": "user", "content": message},
            #      {"role": "assistant", "content": response}],
            #     user_id=user_id,
            # )
            pass
        except Exception as exc:
            logger.warning("Memory write failed: %s", exc)

    # ── Helpers ───────────────────────────────────────────────────────────

    def _build_messages(
        self,
        message: str,
        history: List[Dict],
        memories: List[str],
    ) -> List[Dict]:
        """Assemble the messages list for the Anthropic API."""
        messages: List[Dict] = []

        # Include last N history turns
        for turn in history[-10:]:
            messages.append({"role": turn["role"], "content": turn["content"]})

        # Add memory context as a system-like injection
        if memories:
            memory_ctx = "Relevant context from memory:\n" + "\n".join(
                f"- {m}" for m in memories
            )
            messages.append({"role": "user", "content": memory_ctx})
            messages.append(
                {
                    "role": "assistant",
                    "content": "I have that context noted. How can I help you?",
                }
            )

        messages.append({"role": "user", "content": message})
        return messages

    def _build_system_prompt(
        self, mode: JarvisMode, memories: List[str]
    ) -> str:
        """Build the system prompt, adjusting for the current mode."""
        base = _SYSTEM_PROMPT
        mode_addendum = {
            JarvisMode.focus: (
                "\nMode: FOCUS – Be concise and direct. "
                "Prioritise the single most important answer. Minimal formatting."
            ),
            JarvisMode.research: (
                "\nMode: RESEARCH – Be thorough. "
                "Use multiple sources, cite them, structure your response clearly. "
                "Prefer depth over brevity."
            ),
            JarvisMode.creative: (
                "\nMode: CREATIVE – Be imaginative, exploratory, and engaging. "
                "Feel free to suggest unexpected angles, analogies, or ideas. "
                "Write with flair."
            ),
        }
        return base + mode_addendum.get(mode, "")

    def get_conversation_history(self, conversation_id: str) -> List[Dict]:
        """Return the conversation history for a given ID."""
        return _conversations.get(conversation_id, [])

    def clear_conversation(self, conversation_id: str) -> None:
        """Clear the conversation history for a given ID."""
        _conversations.pop(conversation_id, None)


# ── Singleton ─────────────────────────────────────────────────────────────────
_orchestrator_instance: Optional[Orchestrator] = None


def get_orchestrator() -> Orchestrator:
    """Return the singleton Orchestrator, creating it on first call."""
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = Orchestrator()
    return _orchestrator_instance