from typing import Optional, List
from pydantic import BaseModel


class VoiceRequest(BaseModel):
    audio_b64: str


class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "alloy"


class MemoryItem(BaseModel):
    id: str
    content: str
    metadata: Optional[dict] = None


class MemoryQuery(BaseModel):
    query: str
    limit: int = 5
