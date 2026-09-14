# VoiceGuard-AI — single-origin image: FastAPI serves the API, the WebSocket,
# and the built React frontend. Targets Hugging Face Spaces (Docker SDK) but
# is a plain container and runs anywhere.

# ---------- Stage 1: build the frontend ----------
FROM node:22-slim AS frontend

WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Same-origin deployment, so the bundle uses relative /api and /ws paths.
RUN npm run build


# ---------- Stage 2: runtime ----------
FROM python:3.12-slim

# libsndfile backs soundfile; ffmpeg lets librosa decode mp3/m4a uploads.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libsndfile1 \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Spaces runs containers as a non-root user; give it a writable home so the
# Hugging Face cache and SQLite file land somewhere it can actually write.
RUN useradd -m -u 1000 app
ENV HOME=/home/app \
    HF_HOME=/home/app/.cache/huggingface \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    STATIC_DIR=/app/static \
    PORT=7860

WORKDIR /app

# CPU-only torch — the default wheel pulls CUDA and is several GB larger.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY --from=frontend /build/dist ./static

RUN chown -R app:app /app /home/app
USER app

# Bake the detector weights into the image. Without this the first request
# after every cold start waits ~5 minutes on a 1.2 GB download.
RUN python -c "\
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor; \
m='garystafford/wav2vec2-deepfake-voice-detector'; \
AutoModelForAudioClassification.from_pretrained(m); \
AutoFeatureExtractor.from_pretrained(m); \
print('model cached')"

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD python -c "import urllib.request,os;urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','7860')+'/api/health').read()"

# Single worker on purpose: the model is ~2.3 GB resident and the rate limiter
# keeps its counters in process memory, so replicas would multiply both.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860} --workers 1"]
