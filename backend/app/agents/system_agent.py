"""
app/agents/system_agent.py
──────────────────────────
System agent: handles UI actions like opening tabs, switching panels, etc.
"""
import logging
import time
from typing import AsyncIterator, List

from langchain_core.tools import BaseTool, tool

from app.agents.base_agent import BaseAgent
from app.models.agent import AgentEvent, AgentName, AgentStatus

logger = logging.getLogger(__name__)


def _build_system_tools() -> List[BaseTool]:

    @tool
    def open_website(url: str) -> str:
        """Open a website in a new browser tab."""
        return f"Opening {url}..."

    @tool
    def switch_panel(panel: str) -> str:
        """Switch the current view (dashboard, chat, memory, settings)."""
        return f"Switching to {panel}..."

    return [open_website, switch_panel]


class SystemAgent(BaseAgent):
    """Controls the JARVIS interface and browser behavior."""

    def __init__(self) -> None:
        super().__init__()
        self._tools = _build_system_tools()

    @property
    def name(self) -> AgentName:
        return AgentName.system

    @property
    def description(self) -> str:
        return "Controls the JARVIS interface, opens browser tabs, and manages the UI."

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

        # ── 1. Determine action with a quick LLM call ─────────────────────
        action_prompt = (
            f"User request: {input}\n\n"
            "Return a JSON object with 'tool' (open_website or switch_panel) and 'args' (dict with 'url' or 'panel'). "
            "If it's a website like google, use https://google.com. "
            "If it's a panel, one of: dashboard, chat, memory, settings."
        )
        
        try:
            raw_action = await self._call_llm(
                prompt=action_prompt,
                system="You are a system controller. Respond ONLY with JSON."
            )
            import json
            raw = raw_action.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            action = json.loads(raw.strip())
            tool_name = action.get("tool")
            tool_args = action.get("args", {})

            # ── 2. Emit Tool Call ──────────────────────────────────────────
            yield self._tool_call_event(conversation_id, tool_name, tool_args)
            
            # Simulate tool execution
            result = f"Command executed: {tool_name}"
            yield self._tool_result_event(conversation_id, tool_name, result)

        except Exception as exc:
            logger.error("System action failed: %s", exc)

        # ── 3. Stream confirmation ────────────────────────────────────────
        async for event in self._call_llm_stream(
            conversation_id=conversation_id,
            prompt=f"The user wants to: {input}. Tell them you've performed the action.",
            system="You are JARVIS. Confirm the system action you just took.",
        ):
            yield event

        duration_ms = (time.monotonic() - t0) * 1000
        yield self._end_event(conversation_id, AgentStatus.done, duration_ms)
