from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/")
async def get_memories():
    """STUB: List memories."""
    raise HTTPException(status_code=501, detail="Memory engine not yet implemented (Module 4)")


@router.post("/")
async def add_memory():
    """STUB: Add a new memory."""
    raise HTTPException(status_code=501, detail="Memory engine not yet implemented (Module 4)")


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):
    """STUB: Delete a memory."""
    raise HTTPException(status_code=501, detail="Memory engine not yet implemented (Module 4)")
