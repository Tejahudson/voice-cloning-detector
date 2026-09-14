"""In-memory holding area for uploaded audio bytes, between the HTTP upload
and the WebSocket streaming-analysis pass.

Deliberately not persisted to disk or the database: this is the mechanism
behind the "audio is processed and discarded" privacy claim in the UI. Every
entry is deleted once analysis completes (or after a short TTL if abandoned).
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass

_TTL_SECONDS = 10 * 60


@dataclass
class PendingUpload:
    filename: str
    raw_bytes: bytes
    created_at: float


_store: dict[str, PendingUpload] = {}


def _sweep_expired() -> None:
    now = time.monotonic()
    for key in [k for k, v in _store.items() if now - v.created_at > _TTL_SECONDS]:
        _store.pop(key, None)


def create(filename: str, raw_bytes: bytes) -> str:
    _sweep_expired()
    analysis_id = uuid.uuid4().hex
    _store[analysis_id] = PendingUpload(
        filename=filename, raw_bytes=raw_bytes, created_at=time.monotonic()
    )
    return analysis_id


def get(analysis_id: str) -> PendingUpload | None:
    return _store.get(analysis_id)


def discard(analysis_id: str) -> None:
    _store.pop(analysis_id, None)
