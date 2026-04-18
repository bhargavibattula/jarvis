"""
app/agents/email_agent.py
──────────────────────────
Email agent: reads and sends Gmail messages.
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


def _build_email_tools() -> List[BaseTool]:

    @tool
    def list_emails(max_results: int = 10, query: str = "") -> str:
        """List recent emails from Gmail inbox. Optionally filter by query."""
        # TODO: Module 7 – implement with google-api-python-client
        return "Gmail integration requires OAuth setup. Please connect your Google account."

    @tool
    def send_email(to: str, subject: str, body: str) -> str:
        """Send an email via Gmail."""
        # TODO: Module 7
        return "Gmail integration requires OAuth setup. Please connect your Google account."

    @tool
    def read_email(message_id: str) -> str:
        """Read the full content of a specific email by ID."""
        # TODO: Module 7
        return "Gmail integration requires OAuth setup. Please connect your Google account."

    return [list_emails, send_email, read_email]


class EmailAgent(BaseAgent):
    """Manages Gmail: read, search, compose, and send emails."""

    def __init__(self) -> None:
        super().__init__()
        self._tools = _build_email_tools()

    @property
    def name(self) -> AgentName:
        return AgentName.email

    @property
    def description(self) -> str:
        return "Reads and sends Gmail emails. Requires Google account connection."

    @property
    def tools(self) -> List[BaseTool]:
        return self._tools

    async def run(
        self,
        input: str,
        context: dict,
    ) -> AsyncIterator[AgentEvent]:
        conversation_id: str = context.get("conversation_id", "unknown")
        t0 = time.monotonic()

        yield self._start_event(conversation_id)
        yield self._error_event(
            conversation_id,
            "Gmail integration not yet configured. Please connect your Google account in Settings.",
        )
        yield self._end_event(conversation_id, AgentStatus.error)