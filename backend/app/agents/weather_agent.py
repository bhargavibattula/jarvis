"""
app/agents/weather_agent.py
────────────────────────────
Weather agent: uses OpenWeatherMap (pyowm) to fetch current conditions
and forecasts, then streams a Claude-generated natural-language summary.
"""
from __future__ import annotations

import logging
import time
from typing import AsyncIterator, List

import anthropic
from langchain_core.tools import BaseTool, tool
from tenacity import retry, stop_after_attempt, wait_exponential

from app.agents.base_agent import BaseAgent
from app.core.config import settings
from app.models.agent import AgentEvent, AgentName, AgentStatus

logger = logging.getLogger(__name__)


# ── Tools ─────────────────────────────────────────────────────────────────────

def _build_weather_tools() -> List[BaseTool]:
    """Return LangChain tools for weather queries."""

    @tool
    def get_current_weather(location: str) -> str:
        """Get current weather conditions for a city or location."""
        try:
            import pyowm
            owm = pyowm.OWM(settings.openweathermap_api_key)
            mgr = owm.weather_manager()
            obs = mgr.weather_at_place(location)
            w = obs.weather
            return (
                f"Location: {location}\n"
                f"Status: {w.detailed_status}\n"
                f"Temperature: {w.temperature('celsius')['temp']:.1f}°C "
                f"(feels like {w.temperature('celsius')['feels_like']:.1f}°C)\n"
                f"Humidity: {w.humidity}%\n"
                f"Wind: {w.wind()['speed']:.1f} m/s\n"
                f"Pressure: {w.pressure['press']} hPa\n"
                f"Visibility: {w.visibility_distance or 'N/A'} m\n"
                f"UV Index: {getattr(w, 'uvi', 'N/A')}"
            )
        except Exception as exc:
            logger.warning("Weather fetch failed for %s: %s", location, exc)
            return f"Could not fetch weather for '{location}': {exc}"

    @tool
    def get_weather_forecast(location: str, days: int = 5) -> str:
        """Get a multi-day weather forecast for a city or location."""
        try:
            import pyowm
            owm = pyowm.OWM(settings.openweathermap_api_key)
            mgr = owm.weather_manager()
            fc = mgr.forecast_at_place(location, "3h")
            forecaster = fc.forecaster
            # Summarise each day
            from pyowm.utils import timestamps
            lines = [f"Forecast for {location} (next {days} days):"]
            daily: dict = {}
            for weather in fc.forecast.weathers[:days * 8]:
                day = weather.reference_time("iso8601")[:10]
                if day not in daily:
                    daily[day] = []
                daily[day].append(weather)
                if len(daily) > days:
                    break
            for day, weathers in list(daily.items())[:days]:
                temps = [w.temperature("celsius")["temp"] for w in weathers]
                statuses = [w.detailed_status for w in weathers]
                lines.append(
                    f"  {day}: {min(temps):.0f}°C–{max(temps):.0f}°C, "
                    f"{statuses[len(statuses)//2]}"
                )
            return "\n".join(lines)
        except Exception as exc:
            return f"Could not fetch forecast for '{location}': {exc}"

    return [get_current_weather, get_weather_forecast]


class WeatherAgent(BaseAgent):
    """Fetches weather data and generates natural-language weather reports."""

    def __init__(self) -> None:
        super().__init__()
        self._tools = _build_weather_tools()

    @property
    def name(self) -> AgentName:
        return AgentName.weather

    @property
    def description(self) -> str:
        return "Provides current weather conditions and multi-day forecasts for any location."

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

        # ── 1. Determine location from input ──────────────────────────────
        location = input  # simple pass-through; orchestrator can pre-parse

        # ── 2. Call weather tool ──────────────────────────────────────────
        yield self._tool_call_event(
            conversation_id, "get_current_weather", {"location": location}
        )
        weather_data = self._tools[0].invoke({"location": location})
        yield self._tool_result_event(conversation_id, "get_current_weather", weather_data)

        # ── 3. Optionally fetch forecast if user asked for it ─────────────
        forecast_data = ""
        if any(kw in input.lower() for kw in ["forecast", "week", "days", "tomorrow"]):
            yield self._tool_call_event(
                conversation_id, "get_weather_forecast", {"location": location}
            )
            forecast_data = self._tools[1].invoke({"location": location, "days": 5})
            yield self._tool_result_event(
                conversation_id, "get_weather_forecast", forecast_data
            )

        # ── 4. Stream LLM summary ─────────────────────────────────────────
        prompt = (
            f"User asked: {input}\n\n"
            f"Weather data:\n{weather_data}\n"
            + (f"\nForecast:\n{forecast_data}" if forecast_data else "")
            + "\n\nProvide a helpful, conversational weather summary. "
            "Mention clothing/activity suggestions if relevant. Be concise."
        )

        async for event in self._call_llm_stream(
            conversation_id=conversation_id,
            prompt=prompt,
            system="You are Jarvis, a helpful AI assistant. Give weather summaries in a friendly, concise manner.",
        ):
            yield event

        duration_ms = (time.monotonic() - t0) * 1000
        yield self._end_event(conversation_id, AgentStatus.done, duration_ms)