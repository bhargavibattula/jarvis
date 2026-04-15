import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.api import health, chat, voice, memory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Starting up Jarvis Backend Core...")
    # TODO: Initialize Database pool
    # TODO: Initialize Redis connection
    # TODO: Initialize Qdrant client
    yield
    # Shutdown logic
    logger.info("Shutting down Jarvis Backend Core...")
    # TODO: Close connections


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    debug=settings.DEBUG,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routers
app.include_router(health.router, prefix=f"{settings.API_V1_STR}/health", tags=["Health"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["Chat"])
app.include_router(voice.router, prefix=f"{settings.API_V1_STR}/voice", tags=["Voice"])
app.include_router(memory.router, prefix=f"{settings.API_V1_STR}/memory", tags=["Memory"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to Jarvis AI Backend",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
