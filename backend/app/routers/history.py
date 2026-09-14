from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.models.db import AnalysisRecord, get_session
from app.models.schemas import HistoryItem

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[HistoryItem])
def list_history(session: Session = Depends(get_session)):
    records = session.exec(select(AnalysisRecord).order_by(AnalysisRecord.created_at.desc())).all()
    return [
        HistoryItem(
            id=r.id,
            filename=r.filename,
            duration_seconds=r.duration_seconds,
            risk_score=r.risk_score,
            verdict=r.verdict,
            confidence=r.confidence,
            detector=r.detector,
            created_at=r.created_at.isoformat(),
        )
        for r in records
    ]


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_item(record_id: int, session: Session = Depends(get_session)):
    record = session.get(AnalysisRecord, record_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Record not found.")
    session.delete(record)
    session.commit()
