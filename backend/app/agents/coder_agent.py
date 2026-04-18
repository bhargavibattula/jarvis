"""
app/agents/coder_agent.py
──────────────────────────
Coder agent: generates and executes Python code in an E2B sandbox.
"""
from __future__ import annotations

import logging
import re
import time
from typing import AsyncIterator, List

import anthropic
from langchain_core.tools import BaseTool, tool

from app.agents.base_agent import BaseAgent
from app.core.config import settings
from app.models.agent import AgentEvent, AgentName, AgentStatus

logger = logging.getLogger(__name__)


def _build_coder_tools() -> List[BaseTool]:

    @tool
    def execute_python(code: str) -> str:
        """Execute Python code in a secure E2B sandbox and return the output."""
        try:
            from e2b_code_interpreter import Sandbox
            with Sandbox(api_key=settings.e2b_api_key) as sandbox:
                execution = sandbox.run_code(code)
                output_parts = []
                if execution.logs.stdout:
                    output_parts.append("STDOUT:\n" + "\n".join(execution.logs.stdout))
                if execution.logs.stderr:
                    output_parts.append("STDERR:\n" + "\n".join(execution.logs.stderr))
                if execution.error:
                    output_parts.append(f"ERROR: {execution.error.name}: {execution.error.value}")
                if execution.results:
                    for r in execution.results:
                        if hasattr(r, "text") and r.text:
                            output_parts.append(f"RESULT: {r.text}")
                return "\n".join(output_parts) if output_parts else "Code executed with no output."
        except Exception as exc:
            logger.warning("E2B execution failed: %s", exc)
            return f"Execution failed: {exc}"
    return [execute_python]


class CoderAgent(BaseAgent):
    """Generates, explains, and executes code using a secure E2B sandbox."""

    def __init__(self) -> None:
        super().__init__()
        self._tools = _build_coder_tools()

    @property
    def name(self) -> AgentName:
        return AgentName.coder

    @property
    def description(self) -> str:
        return "Writes and executes Python code in a secure sandbox. Handles data analysis, algorithms, and automation."

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

        # ── 1. Generate code ──────────────────────────────────────────────
        code_prompt = (
            f"Task: {input}\n\n"
            "Write clean, well-commented Python code to accomplish this task. "
            "Output ONLY the Python code inside a ```python ... ``` block. "
            "No explanations before or after the code block."
        )

        generated_code = ""
        try:
            generated_code = await self._call_llm(
                prompt=code_prompt,
                system=(
                    "You are an expert Python developer. "
                    "Write clean, efficient, and well-commented code. "
                    "Always include error handling."
                ),
            )
        except Exception as exc:
            logger.error("Code generation failed: %s", exc)
            yield self._error_event(conversation_id, f"Code generation failed: {exc}")
            yield self._end_event(conversation_id, AgentStatus.error)
            return

        # ── 2. Extract code block ─────────────────────────────────────────
        code_match = re.search(r"```python\n(.*?)```", generated_code, re.DOTALL)
        code = code_match.group(1).strip() if code_match else generated_code.strip()

        # ── 3. Execute in sandbox ─────────────────────────────────────────
        yield self._tool_call_event(
            conversation_id, "execute_python", {"code": code[:500] + "..." if len(code) > 500 else code}
        )
        execution_result = self._tools[0].invoke({"code": code})
        yield self._tool_result_event(conversation_id, "execute_python", execution_result)

        # ── 4. Stream explanation ─────────────────────────────────────────
        explain_prompt = (
            f"Original task: {input}\n\n"
            f"Code written:\n```python\n{code}\n```\n\n"
            f"Execution result:\n{execution_result}\n\n"
            "Explain what the code does, show the result clearly, "
            "and note any important observations."
        )

        async for event in self._call_llm_stream(
            conversation_id=conversation_id,
            prompt=explain_prompt,
            system="You are Jarvis, a helpful coding assistant. Explain code results clearly.",
        ):
            yield event

        duration_ms = (time.monotonic() - t0) * 1000
        yield self._end_event(conversation_id, AgentStatus.done, duration_ms)