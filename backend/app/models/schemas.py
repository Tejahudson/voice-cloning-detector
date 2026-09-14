from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


class MeResponse(BaseModel):
    id: int
    email: str


class PendingUploadResponse(BaseModel):
    analysis_id: str
    filename: str
    duration_hint: str = "computed after decoding"


class FeatureContributionOut(BaseModel):
    feature: str
    suspicion: float
    weight: float
    contribution: float
    explanation: str


class ChunkScoreOut(BaseModel):
    start_time: float
    end_time: float
    risk_score: float
    verdict: str


class AnalysisResult(BaseModel):
    analysis_id: str
    filename: str
    duration_seconds: float
    sample_rate: int
    risk_score: float
    verdict: str
    confidence: float
    contributions: list[FeatureContributionOut]
    chunk_scores: list[ChunkScoreOut]
    waveform_preview: list[float]
    pitch_contour: list[dict]
    spectrogram: list[list[float]]


class HistoryItem(BaseModel):
    id: int
    filename: str
    duration_seconds: float
    risk_score: float
    verdict: str
    confidence: float
    detector: str
    created_at: str
