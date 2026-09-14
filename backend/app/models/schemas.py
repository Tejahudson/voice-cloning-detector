from pydantic import BaseModel


class PendingUploadResponse(BaseModel):
    analysis_id: str
    filename: str


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


class HistoryItem(BaseModel):
    id: int
    filename: str
    duration_seconds: float
    risk_score: float
    verdict: str
    confidence: float
    detector: str
    created_at: str
