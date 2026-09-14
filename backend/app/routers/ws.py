"""Streaming, chunk-by-chunk voice analysis over a WebSocket.

Mirrors the "roughly once a second" real-time scoring cadence described in
the PS26104 brief: the clip is decoded and its per-chunk features computed
once (off the event loop, via a worker thread), then each chunk's score is
delivered to the client paced to its real playback duration, so the UI can
visibly animate the risk score alongside the audio instead of jumping
straight to a final verdict.
"""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from app.core.config import settings
from app.core.deps import get_user_from_token
from app.models.db import AnalysisRecord, get_session
from app.services import audio_io, pending_store, trained_detector
from app.services.feature_extraction import extract_clip_features
from app.services.risk_scoring import score_features

router = APIRouter(tags=["analyze-stream"])


@router.websocket("/ws/analyze/{analysis_id}")
async def ws_analyze(websocket: WebSocket, analysis_id: str, session: Session = Depends(get_session)):
    await websocket.accept()

    token = websocket.query_params.get("token")
    user = get_user_from_token(session, token) if token else None
    if user is None:
        await websocket.send_json({"type": "error", "message": "Not authenticated."})
        await websocket.close(code=4401)
        return

    pending = pending_store.get(analysis_id)
    if pending is None or pending.user_id != user.id:
        await websocket.send_json(
            {"type": "error", "message": "Upload not found or expired — please upload the file again."}
        )
        await websocket.close(code=4404)
        return

    try:
        try:
            y, sr = await asyncio.to_thread(
                audio_io.load_audio, pending.raw_bytes, pending.filename, settings.sample_rate
            )
        except HTTPException as exc:
            await websocket.send_json({"type": "error", "message": exc.detail})
            await websocket.close(code=4422)
            return

        clip = await asyncio.to_thread(extract_clip_features, y, sr, settings.chunk_seconds)

        await websocket.send_json(
            {
                "type": "start",
                "filename": pending.filename,
                "duration_seconds": clip.duration_seconds,
                "sample_rate": clip.sample_rate,
                "total_chunks": len(clip.chunks),
                "waveform_preview": clip.waveform_preview,
                "pitch_contour": clip.pitch_contour,
                "spectrogram": clip.spectrogram,
            }
        )

        for chunk in clip.chunks:
            result = score_features(chunk)
            await websocket.send_json(
                {
                    "type": "chunk",
                    "start_time": chunk.start_time,
                    "end_time": chunk.end_time,
                    "risk_score": result.risk_score,
                    "verdict": result.verdict,
                }
            )
            pace = min(0.6, max(0.05, chunk.end_time - chunk.start_time))
            await asyncio.sleep(pace)

        await websocket.send_json({"type": "model_start"})
        model_result = await asyncio.to_thread(trained_detector.predict, y, sr)

        heuristic = score_features(clip.aggregate)

        if model_result.available:
            detector = "trained_model"
            risk_score = round(model_result.fake_probability * 100, 1)
            verdict = "cloned" if model_result.label == "fake" else "real"
            confidence = round(abs(model_result.fake_probability - 0.5) * 200, 1)
        else:
            detector = "heuristic_fallback"
            risk_score = heuristic.risk_score
            verdict = heuristic.verdict
            confidence = heuristic.confidence

        contributions = [
            {
                "feature": c.feature,
                "suspicion": c.suspicion,
                "weight": c.weight,
                "contribution": c.contribution,
                "explanation": c.explanation,
            }
            for c in heuristic.contributions
        ]

        record = AnalysisRecord(
            user_id=user.id,
            filename=pending.filename,
            duration_seconds=clip.duration_seconds,
            risk_score=risk_score,
            verdict=verdict,
            confidence=confidence,
            detector=detector,
            top_features=json.dumps(contributions[:4]),
        )
        session.add(record)
        session.commit()
        session.refresh(record)

        await websocket.send_json(
            {
                "type": "complete",
                "result": {
                    "analysis_id": analysis_id,
                    "record_id": record.id,
                    "filename": pending.filename,
                    "duration_seconds": clip.duration_seconds,
                    "sample_rate": clip.sample_rate,
                    "risk_score": risk_score,
                    "verdict": verdict,
                    "confidence": confidence,
                    "detector": detector,
                    "model": {
                        "available": model_result.available,
                        "name": settings.trained_model_name,
                        "fake_probability": model_result.fake_probability,
                        "real_probability": model_result.real_probability,
                        "label": model_result.label,
                        "windows_scored": model_result.windows_scored,
                        "window_probabilities": model_result.window_probabilities,
                        "short_clip_warning": model_result.short_clip_warning,
                        "error": model_result.error,
                    },
                    "heuristic": {
                        "risk_score": heuristic.risk_score,
                        "verdict": heuristic.verdict,
                        "confidence": heuristic.confidence,
                    },
                    "contributions": contributions,
                    "raw_features": {
                        "f0_mean_hz": clip.aggregate.f0_mean,
                        "f0_jitter_pct": clip.aggregate.f0_jitter_pct,
                        "shimmer_pct": clip.aggregate.shimmer_pct,
                        "hnr_db": clip.aggregate.hnr_db,
                        "spectral_flatness": clip.aggregate.spectral_flatness,
                        "spectral_flux": clip.aggregate.spectral_flux,
                        "zcr_var": clip.aggregate.zcr_var,
                        "mfcc_delta_var": clip.aggregate.mfcc_delta_var,
                        "formant_bw_var": clip.aggregate.formant_bw_var,
                    },
                },
            }
        )
        await websocket.close()
    except WebSocketDisconnect:
        pass
    finally:
        pending_store.discard(analysis_id)
