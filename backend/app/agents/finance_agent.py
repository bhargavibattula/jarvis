"""
app/agents/finance_agent.py
────────────────────────────
Finance agent: stock quotes, crypto prices, and financial summaries.
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


def _build_finance_tools() -> List[BaseTool]:

    @tool
    def get_stock_price(ticker: str) -> str:
        """Get current stock price and key metrics for a ticker symbol."""
        try:
            import yfinance as yf
            stock = yf.Ticker(ticker.upper())
            info = stock.info
            hist = stock.history(period="1d")
            current = hist["Close"].iloc[-1] if not hist.empty else info.get("currentPrice", "N/A")
            return (
                f"Ticker: {ticker.upper()}\n"
                f"Name: {info.get('longName', 'N/A')}\n"
                f"Price: ${current:.2f}\n"
                f"Change: {info.get('regularMarketChangePercent', 0):.2f}%\n"
                f"Market Cap: ${info.get('marketCap', 0):,.0f}\n"
                f"P/E Ratio: {info.get('trailingPE', 'N/A')}\n"
                f"52-week High: ${info.get('fiftyTwoWeekHigh', 'N/A')}\n"
                f"52-week Low: ${info.get('fiftyTwoWeekLow', 'N/A')}\n"
                f"Volume: {info.get('volume', 'N/A'):,}"
            )
        except Exception as exc:
            logger.warning("Stock fetch failed for %s: %s", ticker, exc)
            return f"Could not fetch stock data for '{ticker}': {exc}"

    @tool
    def get_crypto_price(coin_id: str) -> str:
        """Get current cryptocurrency price and market data (use coin ID like 'bitcoin', 'ethereum')."""
        try:
            from pycoingecko import CoinGeckoAPI
            cg = CoinGeckoAPI()
            data = cg.get_price(
                ids=coin_id.lower(),
                vs_currencies="usd",
                include_market_cap=True,
                include_24hr_change=True,
                include_24hr_vol=True,
            )
            if not data:
                return f"No data found for coin ID '{coin_id}'"
            coin_data = data[coin_id.lower()]
            return (
                f"Coin: {coin_id}\n"
                f"Price: ${coin_data.get('usd', 'N/A'):,.2f}\n"
                f"24h Change: {coin_data.get('usd_24h_change', 0):.2f}%\n"
                f"Market Cap: ${coin_data.get('usd_market_cap', 0):,.0f}\n"
                f"24h Volume: ${coin_data.get('usd_24h_vol', 0):,.0f}"
            )
        except Exception as exc:
            logger.warning("Crypto fetch failed for %s: %s", coin_id, exc)
            return f"Could not fetch crypto data for '{coin_id}': {exc}"

    @tool
    def get_stock_history(ticker: str, period: str = "1mo") -> str:
        """Get historical price data for a stock. Period: 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max"""
        try:
            import yfinance as yf
            stock = yf.Ticker(ticker.upper())
            hist = stock.history(period=period)
            if hist.empty:
                return f"No historical data found for '{ticker}'"
            start_price = hist["Close"].iloc[0]
            end_price = hist["Close"].iloc[-1]
            change_pct = ((end_price - start_price) / start_price) * 100
            high = hist["High"].max()
            low = hist["Low"].min()
            return (
                f"Ticker: {ticker.upper()}, Period: {period}\n"
                f"Start: ${start_price:.2f} → End: ${end_price:.2f}\n"
                f"Change: {change_pct:+.2f}%\n"
                f"Period High: ${high:.2f}, Period Low: ${low:.2f}\n"
                f"Avg Daily Volume: {hist['Volume'].mean():,.0f}"
            )
        except Exception as exc:
            return f"Could not fetch history for '{ticker}': {exc}"

    return [get_stock_price, get_crypto_price, get_stock_history]


class FinanceAgent(BaseAgent):
    """Provides stock and crypto market data with AI-generated analysis."""

    def __init__(self) -> None:
        super().__init__()
        self._tools = _build_finance_tools()

    @property
    def name(self) -> AgentName:
        return AgentName.finance

    @property
    def description(self) -> str:
        return "Fetches stock prices, crypto data, and financial market information."

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

        # ── 1. Extract Entity accurately using LLM ────────────────────────
        # This replaces the brittle regex/keyword mapping
        try:
            extraction_prompt = (
                f"User query: '{input}'\n\n"
                "If the user is asking about a STOCK, return 'STOCK:TICKER' (e.g. 'STOCK:TSLA').\n"
                "If the user is asking about a CRYPTO, return 'CRYPTO:ID' (e.g. 'CRYPTO:bitcoin', use CoinGecko IDs).\n"
                "If unsure, return 'NONE'. Return ONLY the string."
            )
            extracted = await self._call_llm(
                prompt=extraction_prompt, 
                system="You are a financial entity extractor. Respond with the formatted entity string only."
            )
            extracted = extracted.strip().strip("'\"")
        except:
            extracted = "NONE"

        financial_data = ""

        if extracted.startswith("CRYPTO:"):
            coin_id = extracted.split(":")[1].lower()
            yield self._tool_call_event(
                conversation_id, "get_crypto_price", {"coin_id": coin_id}
            )
            financial_data = self._tools[1].invoke({"coin_id": coin_id})
            yield self._tool_result_event(
                conversation_id, "get_crypto_price", financial_data
            )
        elif extracted.startswith("STOCK:"):
            ticker = extracted.split(":")[1].upper()
            yield self._tool_call_event(
                conversation_id, "get_stock_price", {"ticker": ticker}
            )
            financial_data = self._tools[0].invoke({"ticker": ticker})
            yield self._tool_result_event(
                conversation_id, "get_stock_price", financial_data
            )
        else:
            # Final fallback to existing keyword logic if LLM failed
            lower = input.lower()
            crypto_keywords = ["bitcoin", "btc", "ethereum", "eth", "crypto", "coin", "solana", "bnb"]
            is_crypto = any(kw in lower for kw in crypto_keywords)

            if is_crypto:
                coin_id = "bitcoin"
                yield self._tool_call_event(conversation_id, "get_crypto_price", {"coin_id": coin_id})
                financial_data = self._tools[1].invoke({"coin_id": coin_id})
                yield self._tool_result_event(conversation_id, "get_crypto_price", financial_data)
            else:
                ticker = "AAPL"
                yield self._tool_call_event(conversation_id, "get_stock_price", {"ticker": ticker})
                financial_data = self._tools[0].invoke({"ticker": ticker})
                yield self._tool_result_event(conversation_id, "get_stock_price", financial_data)

        # ── Stream LLM analysis ───────────────────────────────────────────
        prompt = (
            f"User asked: {input}\n\n"
            f"Financial data:\n{financial_data}\n\n"
            "Provide a concise, helpful financial summary. "
            "Note any significant price movements or trends. "
            "Do NOT give investment advice."
        )

        async for event in self._call_llm_stream(
            conversation_id=conversation_id,
            prompt=prompt,
            system=(
                "You are Jarvis, a helpful AI assistant. "
                "Provide factual financial information. "
                "Always include a disclaimer that this is not financial advice."
            ),
        ):
            yield event

        duration_ms = (time.monotonic() - t0) * 1000
        yield self._end_event(conversation_id, AgentStatus.done, duration_ms)