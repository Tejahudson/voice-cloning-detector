import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "VoiceGuard-AI"
    jwt_secret: str = os.environ.get("VOICEGUARD_JWT_SECRET", "dev-only-insecure-secret-change-me")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12
    database_url: str = "sqlite:///./voiceguard.db"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Real-time analysis
    chunk_seconds: float = 1.0
    sample_rate: int = 16000

    # Trained deep-learning detector (primary verdict source)
    enable_trained_model: bool = True
    trained_model_name: str = "garystafford/wav2vec2-deepfake-voice-detector"

    # Rate limiting (per user, per window)
    rate_limit_max_requests: int = 20
    rate_limit_window_seconds: int = 60


settings = Settings()
