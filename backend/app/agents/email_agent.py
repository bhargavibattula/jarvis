"""
app/agents/email_agent.py
──────────────────────────
Email agent: reads and sends Gmail messages.
Falls back to drafting content if Google OAuth is not yet configured.
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
        return "Gmail integration requires OAuth setup. Please connect your Google account in Settings."

    @tool
    def send_email(to: str, subject: str, body: str) -> str:
        """Send an email via Gmail."""
        return "Gmail integration requires OAuth setup. Please connect your Google account in Settings."

    @tool
    def read_email(message_id: str) -> str:
        """Read the full content of a specific email by ID."""
        return "Gmail integration requires OAuth setup. Please connect your Google account in Settings."

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
        return "Reads, drafts, and sends Gmail emails. Supports vacation leave requests, follow-ups, etc."

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

        # ── LLM Prompt for drafting ──────────────────────────────────────────
        prompt = (
            f"User request: {input}\n\n"
            "The Google Gmail API is not currently connected via OAuth. "
            "Instead of giving an error, please draft a professional, well-structured email "
            "based on the user's request. Include a Subject line and the Body. "
            "Clearly state at the end that the email has been drafted but not sent "
            "because the Google account is not yet connected."
        )

        async for event in self._call_llm_stream(
            conversation_id=conversation_id,
            prompt=prompt,
            system=(
                "You are Jarvis, a professional executive assistant. "
                "Draft clear, concise, and professional emails. "
                "If an account is not connected, provide the draft text for the user to copy/paste."
            ),
        ):
            yield event

        duration_ms = (time.monotonic() - t0) * 1000
        yield self._end_event(conversation_id, AgentStatus.done, duration_ms)