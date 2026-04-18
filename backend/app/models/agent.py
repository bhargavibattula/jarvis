"""
app/models/agent.py
───────────────────
Pydantic v2 models for agentic event streaming.
AgentEvent is the SINGLE wire format for all WebSocket messages.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class AgentStatus(str, Enum):
    idle = "idle"
    running = "running"
    done = "done"
    error = "error"


class AgentName(str, Enum):
    orchestrator = "orchestrator"
    search = "search"
    email = "email"
    calendar = "calendar"
    coder = "coder"
    drive = "drive"
    finance = "finance"
    weather = "weather"
    news = "news"


class AgentStep(BaseModel):
    """Describes one step inside an agent execution."""

    step_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    step_number: int
    description: str
    status: AgentStatus = AgentStatus.running
    input: Optional[Dict] = None
    output: Optional[Dict] = None
    error: Optional[str] = None
    duration_ms: Optional[float] = None


class AgentTrace(BaseModel):
    """Full trace of an agent run — collected after completion."""

    agent: AgentName
    steps: List[AgentStep] = Field(default_factory=list)
    status: AgentStatus = AgentStatus.idle
    total_duration_ms: Optional[float] = None
    tokens_used: Optional[int] = None


class AgentEvent(BaseModel):
    """
    The single wire format for all WebSocket streaming messages.

    event_type values:
      conversation_id  – sent once at the very start
      agent_start      – an agent begins execution
      agent_end        – an agent finished execution
      agent_step       – a granular step inside an agent
      token            – a streaming LLM text token
      tool_call        – a tool is about to be invoked
      tool_result      – result of a tool call
      memory_read      – memory retrieved for context
      memory_write     – memory written after turn
      error            – non-fatal error (agent keeps running)
      done             – final event; includes full_response
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    event_type: str
    agent: Optional[AgentName] = None
    step: Optional[AgentStep] = None
    data: Optional[Dict] = None
    token: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)