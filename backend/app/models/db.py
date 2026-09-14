from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, Session, SQLModel, create_engine

from app.core.config import settings

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AnalysisRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    filename: str
    duration_seconds: float
    risk_score: float
    verdict: str  # "real" | "cloned"
    confidence: float
    detector: str = "trained_model"  # "trained_model" | "heuristic_fallback"
    top_features: str  # JSON-encoded list of {feature, contribution, note}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _add_missing_columns()


def _add_missing_columns() -> None:
    """Additive migration for databases created before a column existed.

    SQLModel's create_all only creates missing tables, never alters existing
    ones, so a dev database from an earlier run would otherwise break inserts.
    """
    from sqlalchemy import text

    expected = {"detector": "VARCHAR DEFAULT 'trained_model'"}
    with engine.connect() as conn:
        existing = {row[1] for row in conn.execute(text("PRAGMA table_info(analysisrecord)"))}
        if not existing:
            return
        for column, ddl in expected.items():
            if column not in existing:
                conn.execute(text(f"ALTER TABLE analysisrecord ADD COLUMN {column} {ddl}"))
        conn.commit()


def get_session():
    with Session(engine) as session:
        yield session
