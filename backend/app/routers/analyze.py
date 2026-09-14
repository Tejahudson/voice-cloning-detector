from fastapi import APIRouter, HTTPException, Request, UploadFile, status

from app.core.rate_limit import enforce_rate_limit
from app.models.schemas import PendingUploadResponse
from app.services import pending_store

router = APIRouter(prefix="/api/analyze", tags=["analyze"])

ALLOWED_SUFFIXES = (".wav", ".wave", ".mp3", ".m4a", ".flac", ".ogg")
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB


@router.post("/upload", response_model=PendingUploadResponse)
async def upload(file: UploadFile, request: Request):
    # No accounts, so abuse protection keys on the client address instead.
    enforce_rate_limit(f"ip:{request.client.host if request.client else 'unknown'}")

    filename = file.filename or "upload.wav"
    if not filename.lower().endswith(ALLOWED_SUFFIXES):
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Unsupported file type. Please upload one of: {', '.join(ALLOWED_SUFFIXES)}",
        )

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded file is empty.")
    if len(raw_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File exceeds the 25 MB demo limit.")

    analysis_id = pending_store.create(filename=filename, raw_bytes=raw_bytes)
    return PendingUploadResponse(analysis_id=analysis_id, filename=filename)
