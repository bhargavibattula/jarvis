"""
app/api/memory.py
──────────────────
Memory endpoints:
  GET    /memory          – search memories
  POST   /memory          – store a memory
  DELETE /memory/{id}     – delete a specific memory
  DELETE /memory          – clear all memories for a user

Module 4 will replace the 501 stubs with real Mem0 + Qdrant integration.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.voice import MemoryCreateRequest, MemoryItem, MemoryQuery

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("", response_model=List[MemoryItem], summary="Search memories")
async def search_memory(
    query: str = Query(..., min_length=1),
    user_id: str = Query(default="default"),
    top_k: int = Query(default=5, ge=1, le=50),
) -> List[MemoryItem]:
    """
    Search for relevant memories using semantic similarity.
    TODO: Module 4 – implement with Mem0 + Qdrant.
    """
    raise HTTPException(
        status_code=501,
        detail="Memory search not yet implemented. Coming in Module 4.",
    )


@router.post("", response_model=MemoryItem, status_code=201, summary="Store a memory")
async def create_memory(request: MemoryCreateRequest) -> MemoryItem:
    """
    Manually store a memory item.
    TODO: Module 4 – implement with Mem0 + Qdrant.
    """
    raise HTTPException(
        status_code=501,
        detail="Memory creation not yet implemented. Coming in Module 4.",
    )


@router.delete("/{memory_id}", status_code=204, summary="Delete a memory")
async def delete_memory(memory_id: str) -> None:
    """
    Delete a specific memory by ID.
    TODO: Module 4 – implement with Mem0 + Qdrant.
    """
    raise HTTPException(
        status_code=501,
        detail="Memory deletion not yet implemented. Coming in Module 4.",
    )


@router.delete("", status_code=204, summary="Clear all memories for a user")
async def clear_memories(user_id: str = Query(default="default")) -> None:
    """
    Delete all memories for a given user.
    TODO: Module 4 – implement with Mem0 + Qdrant.
    """
    raise HTTPException(
        status_code=501,
        detail="Memory clear not yet implemented. Coming in Module 4.",
    )