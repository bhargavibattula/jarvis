from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field


class AgentName(str, Enum):
    ORCHESTRATOR = "orchestrator"
    SEARCH = "search"
    EMAIL = "email"
    CALENDAR = "calendar"
    CODER = "coder"
    DRIVE = "drive"
    FINANCE = "finance"
    WEATHER = "weather"
    NEWS = "news"


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"


class AgentStep(BaseModel):
    step_id: str
    description: str
    status: AgentStatus
    timestamp: datetime = Field(default_factory=datetime.now)


class AgentTrace(BaseModel):
    steps: List[AgentStep] = Field(default_factory=list)


class AgentEvent(BaseModel):
    id: str = Field(description="UUID of the event")
    conversation_id: str
    event_type: str  # "agent_start" | "agent_step" | "agent_end" | "token" | "tool_call" | "tool_result" | "memory_write" | "memory_read" | "conversation_id" | "error" | "done"
    agent: Optional[AgentName] = None
    step: Optional[AgentStep] = None
    data: Optional[Dict] = None
    token: Optional[str] = None  # streaming text token
    timestamp: datetime = Field(default_factory=datetime.now)
