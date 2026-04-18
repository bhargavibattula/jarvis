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
from __future__ import annotations

import logging
import uuid
from abc import ABC, abstractmethod
from typing import AsyncIterator, List

from langchain_core.tools import BaseTool

from app.models.agent import AgentEvent, AgentName, AgentStep, AgentStatus

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all Jarvis agents."""

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
        """
        Execute the agent and yield AgentEvent objects.

        Implementations MUST:
        1. Emit AgentEvent(event_type="agent_start") first.
        2. Emit AgentEvent(event_type="token") for each streamed LLM token.
        3. Emit AgentEvent(event_type="tool_call") before each tool invocation.
        4. Emit AgentEvent(event_type="tool_result") after each tool returns.
        5. Emit AgentEvent(event_type="agent_end") last.
        6. Catch ALL exceptions, emit AgentEvent(event_type="error"), and
           continue — never let an exception propagate past this method.
        """
        ...

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