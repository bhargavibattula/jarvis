"""
app/api/voice.py
─────────────────
Voice endpoints:
  POST /voice/transcribe  – audio → text (Whisper STT)
  POST /voice/speak       – text → audio (OpenAI TTS)

Module 3 will replace the 501 stubs with real implementations.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response

from app.models.voice import TTSRequest, VoiceRequest, VoiceResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voice", tags=["voice"])


@router.post(
    "/transcribe",
    response_model=VoiceResponse,
    summary="Transcribe audio to text (Whisper)",
)
async def transcribe(
    audio: UploadFile = File(..., description="Audio file (mp3, wav, m4a, webm)"),
    user_id: str = Form(default="default"),
    language: str = Form(default=None),
    conversation_id: str = Form(default=None),
) -> VoiceResponse:
    """
    Transcribe an uploaded audio file using OpenAI Whisper.
    TODO: Module 3 – implement real Whisper transcription.
    """
    raise HTTPException(
        status_code=501,
        detail="Voice transcription not yet implemented. Coming in Module 3.",
    )


@router.post(
    "/speak",
    summary="Convert text to speech (TTS)",
    response_class=Response,
    responses={200: {"content": {"audio/mpeg": {}}}},
)
async def speak(request: TTSRequest) -> Response:
    """
    Convert text to speech using OpenAI TTS.
    Returns raw audio bytes (mp3 by default).
    TODO: Module 3 – implement real TTS synthesis.
    """
    raise HTTPException(
        status_code=501,
        detail="Text-to-speech not yet implemented. Coming in Module 3.",
    )