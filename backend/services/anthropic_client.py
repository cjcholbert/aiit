"""Shared Anthropic client with circuit breaker and retry logic."""
import logging
import os
import time
from collections import deque
from enum import Enum
from pathlib import Path

import anthropic
from dotenv import load_dotenv

# Load .env from AI-ManagerSkills parent folder (shared across all projects)
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")

# Circuit breaker configuration
CB_FAILURE_THRESHOLD = 5  # failures within window to trip
CB_FAILURE_WINDOW = 60  # seconds
CB_COOLDOWN = 30  # seconds before half-open

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]  # seconds — exponential backoff
API_TIMEOUT = 30  # seconds


class CircuitBreakerError(Exception):
    """Raised when the circuit breaker is open and requests are blocked."""
    pass


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """Track failures and short-circuit calls when an upstream is unhealthy."""

    def __init__(
        self,
        failure_threshold: int = CB_FAILURE_THRESHOLD,
        failure_window: float = CB_FAILURE_WINDOW,
        cooldown: float = CB_COOLDOWN,
    ):
        self.failure_threshold = failure_threshold
        self.failure_window = failure_window
        self.cooldown = cooldown
        self._failures: deque[float] = deque()
        self._state = CircuitState.CLOSED
        self._opened_at: float = 0.0

    @property
    def state(self) -> CircuitState:
        if self._state == CircuitState.OPEN:
            if time.monotonic() - self._opened_at >= self.cooldown:
                self._state = CircuitState.HALF_OPEN
                logger.info("Circuit breaker transitioning to HALF_OPEN")
        return self._state

    def record_success(self) -> None:
        if self._state == CircuitState.HALF_OPEN:
            logger.info("Circuit breaker CLOSED after successful test request")
            self._state = CircuitState.CLOSED
            self._failures.clear()

    def record_failure(self) -> None:
        now = time.monotonic()
        self._failures.append(now)

        # Prune failures outside the window
        cutoff = now - self.failure_window
        while self._failures and self._failures[0] < cutoff:
            self._failures.popleft()

        if self._state == CircuitState.HALF_OPEN:
            logger.warning("Circuit breaker re-OPENED after failed test request")
            self._state = CircuitState.OPEN
            self._opened_at = now
        elif len(self._failures) >= self.failure_threshold:
            logger.warning(
                "Circuit breaker OPENED: %d failures in %ds",
                len(self._failures),
                self.failure_window,
            )
            self._state = CircuitState.OPEN
            self._opened_at = now

    def check(self) -> None:
        """Raise CircuitBreakerError if state is OPEN."""
        current = self.state
        if current == CircuitState.OPEN:
            raise CircuitBreakerError(
                "Anthropic API circuit breaker is OPEN — too many recent failures. "
                f"Retry after {self.cooldown}s cooldown."
            )


# Module-level singleton
_circuit_breaker = CircuitBreaker()


def get_anthropic_client() -> anthropic.Anthropic:
    """Return a configured Anthropic client.

    Checks the circuit breaker before returning. Callers should wrap API calls
    with :func:`call_anthropic` for automatic retry + circuit-breaker tracking.
    """
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set in environment")
    _circuit_breaker.check()
    return anthropic.Anthropic(
        api_key=ANTHROPIC_API_KEY,
        timeout=API_TIMEOUT,
    )


def call_anthropic(func, *args, **kwargs):
    """Execute *func* with retry + circuit-breaker protection (sync).

    ``func`` receives the Anthropic client as its first positional argument
    followed by any extra ``*args`` / ``**kwargs``.

    Example::

        response = call_anthropic(
            lambda client: client.messages.create(model=..., messages=...)
        )
    """
    _circuit_breaker.check()

    client = get_anthropic_client()
    last_exc: Exception | None = None

    for attempt in range(MAX_RETRIES):
        try:
            result = func(client, *args, **kwargs)
            _circuit_breaker.record_success()
            return result
        except (anthropic.RateLimitError, anthropic.APIConnectionError, anthropic.InternalServerError) as exc:
            last_exc = exc
            _circuit_breaker.record_failure()
            if attempt < MAX_RETRIES - 1:
                delay = RETRY_DELAYS[attempt]
                logger.warning(
                    "Anthropic call failed (attempt %d/%d), retrying in %ds: %s",
                    attempt + 1,
                    MAX_RETRIES,
                    delay,
                    exc,
                )
                time.sleep(delay)
        except anthropic.AuthenticationError:
            raise  # never retry auth errors
        except anthropic.APIError as exc:
            _circuit_breaker.record_failure()
            raise  # surface unexpected API errors immediately

    # All retries exhausted
    raise last_exc  # type: ignore[misc]
