"""
app/agents/news_agent.py
─────────────────────────
News agent: fetches top headlines and articles via NewsAPI.
"""
from __future__ import annotations

import logging
import time
from typing import AsyncIterator, List, Optional

import anthropic
from langchain_core.tools import BaseTool, tool

from app.agents.base_agent import BaseAgent
from app.core.config import settings
from app.models.agent import AgentEvent, AgentName, AgentStatus

logger = logging.getLogger(__name__)


def _build_news_tools() -> List[BaseTool]:

    @tool
    def get_top_headlines(
        category: Optional[str] = None,
        country: str = "us",
        query: Optional[str] = None,
        page_size: int = 5,
    ) -> str:
        """
        Fetch top news headlines. Category: business, entertainment, general,
        health, science, sports, technology. Optionally pass a search query.
        """
        try:
            from newsapi import NewsApiClient
            newsapi = NewsApiClient(api_key=settings.newsapi_key)
            params: dict = {"language": "en", "page_size": page_size}
            if category:
                params["category"] = category
            if country:
                params["country"] = country
            if query:
                params["q"] = query
            resp = newsapi.get_top_headlines(**params)
            articles = resp.get("articles", [])
            if not articles:
                return "No headlines found."
            lines = [f"Top {len(articles)} headlines:\n"]
            for i, a in enumerate(articles, 1):
                lines.append(f"[{i}] {a.get('title', 'No title')}")
                lines.append(f"    Source: {a.get('source', {}).get('name', 'Unknown')}")
                lines.append(f"    {a.get('description', '')[:200]}")
                lines.append(f"    URL: {a.get('url', '')}")
                lines.append("")
            return "\n".join(lines)
        except Exception as exc:
            logger.warning("News fetch failed: %s", exc)
            return f"Could not fetch news: {exc}"

    @tool
    def search_news(query: str, from_date: Optional[str] = None, page_size: int = 5) -> str:
        """Search for news articles on a specific topic. from_date format: YYYY-MM-DD."""
        try:
            from newsapi import NewsApiClient
            newsapi = NewsApiClient(api_key=settings.newsapi_key)
            params: dict = {
                "q": query,
                "language": "en",
                "sort_by": "relevancy",
                "page_size": page_size,
            }
            if from_date:
                params["from_param"] = from_date
            resp = newsapi.get_everything(**params)
            articles = resp.get("articles", [])
            if not articles:
                return f"No news found for '{query}'."
            lines = [f"News articles about '{query}':\n"]
            for i, a in enumerate(articles, 1):
                lines.append(f"[{i}] {a.get('title', 'No title')}")
                lines.append(f"    Source: {a.get('source', {}).get('name', 'Unknown')}")
                lines.append(f"    Published: {a.get('publishedAt', 'N/A')[:10]}")
                lines.append(f"    {a.get('description', '')[:200]}")
                lines.append("")
            return "\n".join(lines)
        except Exception as exc:
            logger.warning("News search failed for '%s': %s", query, exc)
            return f"Could not search news for '{query}': {exc}"
    return [get_top_headlines, search_news]


class NewsAgent(BaseAgent):
    """Fetches and summarises news headlines and articles."""

    def __init__(self) -> None:
        super().__init__()
        self._tools = _build_news_tools()

    @property
    def name(self) -> AgentName:
        return AgentName.news

    @property
    def description(self) -> str:
        return "Fetches top news headlines and searches for articles on specific topics."

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

        lower = input.lower()

        # ── Determine whether to search or get headlines ──────────────────
        has_topic = any(
            kw in lower for kw in ["about", "latest on", "news on", "find", "search"]
        )

        if has_topic:
            yield self._tool_call_event(
                conversation_id, "search_news", {"query": input}
            )
            news_data = self._tools[1].invoke({"query": input})
            yield self._tool_result_event(conversation_id, "search_news", news_data)
        else:
            # Detect category
            categories = ["business", "entertainment", "health", "science", "sports", "technology"]
            category = next((c for c in categories if c in lower), None)
            yield self._tool_call_event(
                conversation_id,
                "get_top_headlines",
                {"category": category or "general"},
            )
            news_data = self._tools[0].invoke(
                {"category": category, "country": "us", "page_size": 5}
            )
            yield self._tool_result_event(
                conversation_id, "get_top_headlines", news_data
            )

        # ── Stream LLM summary ────────────────────────────────────────────
        prompt = (
            f"User asked: {input}\n\n"
            f"News data:\n{news_data}\n\n"
            "Summarise the key stories in a conversational, engaging way. "
            "Highlight the most important or interesting developments."
        )

        async for event in self._call_llm_stream(
            conversation_id=conversation_id,
            prompt=prompt,
            system="You are Jarvis, a knowledgeable AI assistant. Present news clearly and engagingly.",
        ):
            yield event

        duration_ms = (time.monotonic() - t0) * 1000
        yield self._end_event(conversation_id, AgentStatus.done, duration_ms)