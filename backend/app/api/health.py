from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check."""
    return {"status": "ok", "version": "0.1.0"}


@router.get("/health/ready")
async def readiness_check():
    """Readiness check for external services."""
    # TODO: Add DB/Redis/Qdrant connection checks
    return {"status": "ready"}
