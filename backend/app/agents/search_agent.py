"""
app/agents/search_agent.py
───────────────────────────
Search agent: uses Tavily for web search, streams a Claude summary.
"""
from __future__ import annotations

import logging
import time
from typing import AsyncIterator, List, Optional

import anthropic
from langchain_core.tools import BaseTool, tool
from tenacity import retry, stop_after_attempt, wait_exponential

from app.agents.base_agent import BaseAgent
from app.core.config import settings
from app.models.agent import AgentEvent, AgentName, AgentStatus

logger = logging.getLogger(__name__)


def _build_search_tools() -> List[BaseTool]:

    @tool
    def web_search(query: str, max_results: int = 5) -> str:
        """Search the web for up-to-date information using Tavily."""
        try:
            from tavily import TavilyClient
            client = TavilyClient(api_key=settings.tavily_api_key)
            results = client.search(
                query=query,
                max_results=max_results,
                include_answer=True,
                include_raw_content=False,
            )
            lines = []
            if results.get("answer"):
                lines.append(f"Quick answer: {results['answer']}\n")
            for i, r in enumerate(results.get("results", []), 1):
                lines.append(f"[{i}] {r.get('title', 'Untitled')}")
                lines.append(f"    URL: {r.get('url', '')}")
                lines.append(f"    {r.get('content', '')[:300]}")
                lines.append("")
            return "\n".join(lines) or "No results found."
        except Exception as exc:
            logger.warning("Tavily search failed: %s", exc)
            return f"Search failed: {exc}"

    @tool
    def fetch_page(url: str) -> str:
        """Fetch and extract text content from a web page URL."""
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, timeout=15_000)
                text = page.inner_text("body")
                browser.close()
            return text[:4000]
        except Exception as exc:
            logger.warning("fetch_page failed for %s: %s", url, exc)
            return f"Could not fetch page: {exc}"

    return [web_search, fetch_page]


class SearchAgent(BaseAgent):
    """Performs web searches and returns summarised, cited answers."""

    def __init__(self) -> None:
        super().__init__()
        self._tools = _build_search_tools()

    @property
    def name(self) -> AgentName:
        return AgentName.search

    @property
    def description(self) -> str:
        return "Searches the web for current information and answers questions with citations."

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

        # ── 1. Web search ─────────────────────────────────────────────────
        yield self._tool_call_event(
            conversation_id, "web_search", {"query": input}
        )
        search_results = self._tools[0].invoke({"query": input, "max_results": 5})
        yield self._tool_result_event(conversation_id, "web_search", search_results)

        # ── 2. Stream LLM synthesis ───────────────────────────────────────
        prompt = (
            f"User query: {input}\n\n"
            f"Search results:\n{search_results}\n\n"
            "Synthesise a clear, accurate answer with citations where helpful. "
            "If the results are insufficient, say so."
        )

        async for event in self._call_llm_stream(
            conversation_id=conversation_id,
            prompt=prompt,
            system=(
                "You are Jarvis, a helpful AI assistant with access to web search. "
                "Give accurate, well-sourced answers. Be concise but complete."
            ),
        ):
            yield event

        duration_ms = (time.monotonic() - t0) * 1000
        yield self._end_event(conversation_id, AgentStatus.done, duration_ms)