"""
app/api/memory.py
──────────────────
Memory endpoints:
  GET    /memory          – search memories
  POST   /memory          – store a memory
  DELETE /memory/{id}     – delete a specific memory
  DELETE /memory          – clear all memories for a user
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from mem0 import Memory

from app.core.config import settings
from app.models.voice import MemoryCreateRequest, MemoryItem

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/memory", tags=["memory"])


def _get_memory_client() -> Memory:
    """Initialise and return a Mem0 client with Qdrant config."""
    config = {
        "vector_store": {
            "provider": "qdrant",
            "config": {
                "url": settings.qdrant_url,
                "collection_name": settings.qdrant_collection,
            }
        }
    }
    if settings.mem0_api_key:
        config["llm"] = {"provider": "openai", "config": {"api_key": settings.openai_api_key}}
    
    return Memory.from_config(config)


@router.get("", response_model=List[MemoryItem], summary="Search memories")
async def search_memory(
    query: str = Query(..., min_length=1),
    user_id: str = Query(default="default"),
    top_k: int = Query(default=5, ge=1, le=50),
) -> List[MemoryItem]:
    """
    Search for relevant memories using semantic similarity.
    """
    try:
        m = _get_memory_client()
        results = m.search(query, user_id=user_id, limit=top_k)
        
        memories = []
        for r in results:
            memories.append(MemoryItem(
                id=r.get("id"),
                content=r.get("memory", ""),
                score=r.get("score"),
                user_id=user_id,
                metadata=r.get("metadata", {})
            ))
        return memories
    except Exception as exc:
        logger.error("Memory search failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("", response_model=MemoryItem, status_code=201, summary="Store a memory")
async def create_memory(request: MemoryCreateRequest) -> MemoryItem:
    """
    Manually store a memory item.
    """
    try:
        m = _get_memory_client()
        result = m.add(request.content, user_id=request.user_id, metadata=request.metadata)
        
        # Result is usually a list of added memories
        if isinstance(result, list) and len(result) > 0:
            mem = result[0]
            return MemoryItem(
                id=mem.get("id"),
                content=mem.get("memory", request.content),
                user_id=request.user_id,
                metadata=request.metadata
            )
        return MemoryItem(content=request.content, user_id=request.user_id)
    except Exception as exc:
        logger.error("Memory creation failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/{memory_id}", status_code=204, summary="Delete a memory")
async def delete_memory(memory_id: str) -> None:
    """
    Delete a specific memory by ID.
    """
    try:
        m = _get_memory_client()
        m.delete(memory_id)
    except Exception as exc:
        logger.error("Memory deletion failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("", status_code=204, summary="Clear all memories for a user")
async def clear_memories(user_id: str = Query(default="default")) -> None:
    """
    Delete all memories for a given user.
    """
    try:
        m = _get_memory_client()
        m.delete_all(user_id=user_id)
    except Exception as exc:
        logger.error("Memory clear failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))