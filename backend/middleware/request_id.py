"""Request tracing middleware for AI Manager Skills Platform."""
import logging
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique X-Request-ID to every request/response and inject into log context."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        logger.info(
            "request_start method=%s path=%s request_id=%s",
            request.method,
            request.url.path,
            request_id,
        )

        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        logger.info(
            "request_end status=%s request_id=%s",
            response.status_code,
            request_id,
        )
        return response
