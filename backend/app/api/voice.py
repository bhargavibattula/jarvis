from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/transcribe")
async def transcribe_voice():
    """STUB: Transcribe audio to text."""
    raise HTTPException(status_code=501, detail="Voice engine not yet implemented (Module 3)")


@router.post("/speak")
async def text_to_speech():
    """STUB: Convert text to speech."""
    raise HTTPException(status_code=501, detail="Voice engine not yet implemented (Module 3)")
