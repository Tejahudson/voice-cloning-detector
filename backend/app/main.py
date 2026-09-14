import logging
import threading
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.models.db import init_db
from app.routers import analyze, history, ws
from app.services import trained_detector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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


# --- Static frontend (single-origin deployment) ----------------------------
# Registered last so it can't shadow the API or WebSocket routes above.

_static = Path(settings.static_dir) if settings.static_dir else None

if _static and _static.is_dir():
    index_file = _static / "index.html"

    # Mounting a missing directory raises at import time, which would turn a
    # bad build into a crash loop rather than a degraded page.
    if (_static / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=_static / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        """Serve real files when they exist, otherwise hand back index.html.

        The client router owns /analyze and /history, so a hard refresh on
        those paths must return the app shell rather than a 404.
        """
        candidate = (_static / full_path).resolve()
        # Guard against path traversal escaping the static root.
        if full_path and _static.resolve() in candidate.parents and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(index_file)

    logger.info("Serving frontend from %s", _static)
else:
    logger.info("No static_dir configured; running API-only")
