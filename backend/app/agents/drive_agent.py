"""
app/agents/drive_agent.py
──────────────────────────
Drive agent: searches and retrieves Google Drive files.
TODO: Module 7 – wire up Google OAuth token flow.
"""
from __future__ import annotations
import logging
from typing import AsyncIterator
import anthropic
from app.agents.base_agent import BaseAgent
from app.core.config import settings
from app.models.agent import AgentEvent, AgentName, AgentStatus

logger = logging.getLogger(__name__)


class DriveAgent(BaseAgent):
    """Searches and retrieves Google Drive files. TODO: Module 7."""

    def __init__(self) -> None:
        super().__init__()

    @property
    def name(self) -> AgentName:
        return AgentName.drive

    @property
    def description(self) -> str:
        return "Searches and reads Google Drive files. Requires Google account connection."

    async def run(self, input: str, context: dict) -> AsyncIterator[AgentEvent]:
        conversation_id = context.get("conversation_id", "unknown")
        yield self._start_event(conversation_id)
        yield self._error_event(
            conversation_id,
            "Google Drive integration not yet configured. Coming in Module 7.",
        )
        yield self._end_event(conversation_id, AgentStatus.error)