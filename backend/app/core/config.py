from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "VoiceGuard-AI"
    database_url: str = "sqlite:///./voiceguard.db"
    # Comma-separated in the environment, e.g.
    #   CORS_ORIGINS=https://voiceguard.vercel.app
    # Use "*" when the frontend is hosted separately and its origin isn't fixed
    # (a Vercel preview URL, say). Safe here only because the API carries no
    # cookies or credentials — see main.py, which disables allow_credentials
    # whenever the origin list is a wildcard.
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Set in the container to the built frontend. When present the API also
    # serves the SPA, so everything runs on a single origin and CORS and
    # cross-origin WebSocket setup stop being a concern.
    static_dir: str = ""

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
