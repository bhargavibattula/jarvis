"""
app/agents/base_agent.py
────────────────────────
Abstract base class that every Jarvis agent must inherit from.

Each concrete agent must implement:
  - `name`         – AgentName enum value
  - `description`  – human-readable description (used by orchestrator)
  - `run()`        – async generator that yields AgentEvent objects
  - `tools`        – list of LangChain BaseTool instances (can be empty)
"""
import logging
from abc import ABC, abstractmethod
from typing import AsyncIterator, List

import anthropic
import groq
from langchain_core.tools import BaseTool

from app.core.config import settings
from app.models.agent import AgentEvent, AgentName, AgentStep, AgentStatus

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all Jarvis agents."""

    def __init__(self) -> None:
        self._anthropic = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self._groq = groq.Groq(api_key=settings.groq_api_key)

    @property
    @abstractmethod
    def name(self) -> AgentName:
        """Unique agent name."""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """One-line description of what this agent does."""
        ...

    @property
    def tools(self) -> List[BaseTool]:
        """LangChain tool wrappers exposed by this agent. Override as needed."""
        return []

    @abstractmethod
    async def run(
        self,
        input: str,
        context: dict,
    ) -> AsyncIterator[AgentEvent]:
        """Execute the agent and yield AgentEvent objects."""
        ...

    # ── LLM Helper ────────────────────────────────────────────────────────

    async def _call_llm_stream(
        self,
        conversation_id: str,
        prompt: str,
        system: str = "You are Jarvis, a helpful AI assistant.",
    ) -> AsyncIterator[AgentEvent]:
        """Stream tokens from the primary LLM provider."""
        try:
            if settings.primary_provider == "groq":
                messages = [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ]
                stream = self._groq.chat.completions.create(
                    model=settings.groq_model,
                    messages=messages,
                    max_tokens=settings.anthropic_max_tokens,
                    stream=True,
                )
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield self._token_event(conversation_id, chunk.choices[0].delta.content)
            else:
                with self._anthropic.messages.stream(
                    model=settings.anthropic_model,
                    max_tokens=settings.anthropic_max_tokens,
                    system=system,
                    messages=[{"role": "user", "content": prompt}],
                ) as stream:
                    for text in stream.text_stream:
                        yield self._token_event(conversation_id, text)
        except Exception as exc:
            logger.error("LLM streaming error in %s: %s", self.name.value, exc)
            yield self._error_event(conversation_id, f"LLM error: {exc}")

    async def _call_llm(
        self,
        prompt: str,
        system: str = "You are Jarvis, a helpful AI assistant.",
    ) -> str:
        """Non-streaming LLM call."""
        try:
            if settings.primary_provider == "groq":
                response = self._groq.chat.completions.create(
                    model=settings.groq_model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=settings.anthropic_max_tokens,
                )
                return response.choices[0].message.content
            else:
                response = self._anthropic.messages.create(
                    model=settings.anthropic_model,
                    max_tokens=settings.anthropic_max_tokens,
                    system=system,
                    messages=[{"role": "user", "content": prompt}],
                )
                return response.content[0].text
        except Exception as exc:
            logger.error("LLM call failed in %s: %s", self.name.value, exc)
            raise exc

    # ── Convenience factories ─────────────────────────────────────────────

    def _start_event(self, conversation_id: str) -> AgentEvent:
        return AgentEvent(
            conversation_id=conversation_id,
            event_type="agent_start",
            agent=self.name,
            data={"description": self.description},
        )

    def _end_event(
        self,
        conversation_id: str,
        status: AgentStatus = AgentStatus.done,
        duration_ms: float | None = None,
    ) -> AgentEvent:
        data: dict = {"status": status.value}
        if duration_ms is not None:
            data["duration_ms"] = duration_ms
        return AgentEvent(
            conversation_id=conversation_id,
            event_type="agent_end",
            agent=self.name,
            data=data,
        )

    def _tool_call_event(
        self, conversation_id: str, tool_name: str, tool_input: dict
    ) -> AgentEvent:
        return AgentEvent(
            conversation_id=conversation_id,
            event_type="tool_call",
            agent=self.name,
            data={"tool": tool_name, "input": tool_input},
        )

    def _tool_result_event(
        self, conversation_id: str, tool_name: str, result: str
    ) -> AgentEvent:
        return AgentEvent(
            conversation_id=conversation_id,
            event_type="tool_result",
            agent=self.name,
            data={"tool": tool_name, "result": result},
        )

    def _error_event(
        self, conversation_id: str, message: str
    ) -> AgentEvent:
        return AgentEvent(
            conversation_id=conversation_id,
            event_type="error",
            agent=self.name,
            data={"message": message},
        )

    def _token_event(self, conversation_id: str, token: str) -> AgentEvent:
        return AgentEvent(
            conversation_id=conversation_id,
            event_type="token",
            agent=self.name,
            token=token,
        )