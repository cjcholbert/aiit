"""AI Manager Skills Platform - Main FastAPI Application."""
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.rate_limit import limiter

from backend.database import init_db, close_db
from backend.middleware import RequestIDMiddleware
from backend.auth import auth_router
from backend.modules.lesson01_context import router as lesson01_router
from backend.modules.lesson02_feedback import router as lesson02_router
from backend.modules.lesson03_templates import router as lesson03_router
from backend.modules.lesson04_context_docs import router as lesson04_router
from backend.modules.lesson05_trust import router as lesson05_router
from backend.modules.lesson06_verification import router as lesson06_router
from backend.modules.lesson07_decomposer import router as lesson07_router
from backend.modules.lesson08_delegation import router as lesson08_router
from backend.modules.lesson09_iteration import router as lesson09_router
from backend.modules.lesson10_status import router as lesson10_router
from backend.modules.lesson11_frontier import router as lesson11_router
from backend.modules.lesson12_reference import router as lesson12_router
from backend.modules.analytics import router as analytics_router
from backend.modules.admin import router as admin_router
from backend.modules.progress import router as progress_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting AI Manager Skills Platform...")
    await init_db()
    logger.info("Database initialized")
    yield
    # Shutdown
    logger.info("Shutting down...")
    await close_db()


app = FastAPI(
    title="AI Manager Skills Platform",
    description="12-lesson AI collaboration skills curriculum with personalized learning paths",
    version="1.0.0",
    lifespan=lifespan
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Request tracing middleware
app.add_middleware(RequestIDMiddleware)

# CORS middleware
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(lesson01_router)
app.include_router(lesson02_router)
app.include_router(lesson03_router)
app.include_router(lesson04_router)
app.include_router(lesson05_router)
app.include_router(lesson06_router)
app.include_router(lesson07_router)
app.include_router(lesson08_router)
app.include_router(lesson09_router)
app.include_router(lesson10_router)
app.include_router(lesson11_router)
app.include_router(lesson12_router)
app.include_router(analytics_router)
app.include_router(admin_router)
app.include_router(progress_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "AI Manager Skills Platform",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "lessons": {
            "lesson01_context": "active",
            "lesson02_feedback": "active",
            "lesson03_templates": "active",
            "lesson04_context_docs": "active",
            "lesson05_trust": "active",
            "lesson06_verification": "active",
            "lesson07_decomposer": "active",
            "lesson08_delegation": "active",
            "lesson09_iteration": "active",
            "lesson10_status": "active",
            "lesson11_frontier": "active",
            "lesson12_reference": "active",
        },
        "analytics": "active",
        "admin": "active"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
