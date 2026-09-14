import time
from collections import defaultdict, deque

from fastapi import HTTPException, status

from app.core.config import settings

_hits: dict[str, deque] = defaultdict(deque)


def enforce_rate_limit(key: str) -> None:
    """Simple in-memory sliding-window rate limiter, keyed per user/IP.

    Demo-grade: resets on server restart and doesn't share state across
    workers. Good enough to demonstrate abuse-prevention in the prototype.
    """
    now = time.monotonic()
    window = settings.rate_limit_window_seconds
    bucket = _hits[key]

    while bucket and now - bucket[0] > window:
        bucket.popleft()

    if len(bucket) >= settings.rate_limit_max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many analysis requests. Please slow down and try again shortly.",
        )

    bucket.append(now)
