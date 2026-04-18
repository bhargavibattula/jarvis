"""
app/agents/calendar_agent.py
─────────────────────────────
Calendar agent: reads and creates Google Calendar events.
TODO: Module 7 – wire up Google OAuth token flow.
"""
from __future__ import annotations
import logging
import time
from typing import AsyncIterator, List
import anthropic
from langchain_core.tools import BaseTool, tool
from app.agents.base_agent import BaseAgent
from app.core.config import settings
from app.models.agent import AgentEvent, AgentName, AgentStatus

logger = logging.getLogger(__name__)


class CalendarAgent(BaseAgent):
    """Manages Google Calendar events. TODO: Module 7."""

    def __init__(self) -> None:
        self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    @property
    def name(self) -> AgentName:
        return AgentName.calendar

    @property
    def description(self) -> str:
        return "Reads and creates Google Calendar events. Requires Google account connection."

    async def run(self, input: str, context: dict) -> AsyncIterator[AgentEvent]:
        conversation_id = context.get("conversation_id", "unknown")
        yield self._start_event(conversation_id)
        yield self._error_event(
            conversation_id,
            "Google Calendar integration not yet configured. Coming in Module 7.",
        )
        yield self._end_event(conversation_id, AgentStatus.error)