from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class Role(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class JarvisMode(str, Enum):
    FOCUS = "focus"
    RESEARCH = "research"
    CREATIVE = "creative"


class ChatMessage(BaseModel):
    role: Role
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    mode: JarvisMode = JarvisMode.FOCUS
    stream: bool = True
    user_id: str = "default"
    context: Optional[Dict] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    full_response: str
