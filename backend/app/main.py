import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.models.db import init_db
from app.routers import analyze, history, ws
from app.services import trained_detector

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    # Warm the detector in the background so the first real analysis doesn't
    # pay the one-time model load (~20s from local cache, longer on first run
    # when the weights still have to be downloaded).
    threading.Thread(target=trained_detector._load, daemon=True).start()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "detector_ready": trained_detector.is_ready(),
    }


app.include_router(analyze.router)
app.include_router(history.router)
app.include_router(ws.router)
