"""
app/api/voice.py
─────────────────
Voice endpoints:
  POST /voice/transcribe  – audio → text (Whisper STT)
  POST /voice/speak       – text → audio (OpenAI TTS)
"""
from __future__ import annotations

import logging
from io import BytesIO

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from openai import OpenAI

from app.core.config import settings
from app.models.voice import TTSRequest, VoiceResponse

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
    """
    if not settings.openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        
        # Read file into memory
        file_content = await audio.read()
        file_obj = BytesIO(file_content)
        file_obj.name = audio.filename  # Whisper needs a filename/extension

        transcript = client.audio.transcriptions.create(
            model=settings.whisper_model,
            file=file_obj,
            language=language,
        )

        return VoiceResponse(
            transcript=transcript.text,
            language=language or "auto",
        )
    except Exception as exc:
        logger.error("Whisper transcription failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(exc)}")


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
    """
    if not settings.openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        
        response = client.audio.speech.create(
            model=request.model or settings.tts_model,
            voice=request.voice or settings.tts_voice,
            input=request.text,
            speed=request.speed,
            response_format=request.response_format,
        )

        # Return the audio content as a streaming response or bytes
        audio_content = response.content
        return Response(content=audio_content, media_type=f"audio/{request.response_format}")
    except Exception as exc:
        logger.error("TTS synthesis failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(exc)}")