from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, Session, SQLModel, create_engine

from app.core.config import settings

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})


class AnalysisRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    duration_seconds: float
    risk_score: float
    verdict: str  # "real" | "cloned"
    confidence: float
    detector: str = "trained_model"  # "trained_model" | "heuristic_fallback"
    top_features: str  # JSON-encoded list of {feature, contribution, note}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def init_db() -> None:
    _migrate()
    SQLModel.metadata.create_all(engine)


def _migrate() -> None:
    """Bring a pre-existing database up to the current schema.

    Two historical shapes are handled: databases created before the `detector`
    column existed, and databases from when analyses were scoped to a user
    account. Authentication has since been removed, so `user_id` is dropped
    and the `user` table with it — existing analysis rows are preserved.
    """
    from sqlalchemy import text

    with engine.connect() as conn:
        cols = {row[1] for row in conn.execute(text("PRAGMA table_info(analysisrecord)"))}
        if not cols:
            return  # fresh database; create_all builds it correctly

        if "detector" not in cols:
            conn.execute(
                text("ALTER TABLE analysisrecord ADD COLUMN detector VARCHAR DEFAULT 'trained_model'")
            )
            conn.commit()
            cols.add("detector")

        if "user_id" in cols:
            # SQLite can't drop a column in place on older versions, so rebuild
            # the table and copy every row across without user_id.
            conn.execute(
                text(
                    """
                    CREATE TABLE analysisrecord_new (
                        id INTEGER NOT NULL PRIMARY KEY,
                        filename VARCHAR NOT NULL,
                        duration_seconds FLOAT NOT NULL,
                        risk_score FLOAT NOT NULL,
                        verdict VARCHAR NOT NULL,
                        confidence FLOAT NOT NULL,
                        detector VARCHAR NOT NULL DEFAULT 'trained_model',
                        top_features VARCHAR NOT NULL,
                        created_at DATETIME NOT NULL
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO analysisrecord_new
                        (id, filename, duration_seconds, risk_score, verdict,
                         confidence, detector, top_features, created_at)
                    SELECT id, filename, duration_seconds, risk_score, verdict,
                           confidence, COALESCE(detector, 'trained_model'), top_features, created_at
                    FROM analysisrecord
                    """
                )
            )
            conn.execute(text("DROP TABLE analysisrecord"))
            conn.execute(text("ALTER TABLE analysisrecord_new RENAME TO analysisrecord"))
            conn.execute(text("DROP TABLE IF EXISTS user"))
            conn.commit()


def get_session():
    with Session(engine) as session:
        yield session
