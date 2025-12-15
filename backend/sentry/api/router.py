"""Main API router configuration."""

import logging

from django.http import HttpRequest, HttpResponse
from ninja import NinjaAPI
from sentry.settings.config import settings

from .v1.router import router_v1

api = NinjaAPI(
    title="Sentry API",
    version="1.0.0",
    description="API for Sentry, a crash-detection IoT device attachable to helmets to help riders inform loved ones in times of emergency",  # noqa: E501
    docs_url="docs/" if settings.django_debug else None,
    openapi_url="openapi.json/" if settings.django_debug else None,
)


@api.exception_handler(Exception)
def global_exception_handler(
    request: HttpRequest,
    exc: Exception,
) -> HttpResponse:
    """Handle all unhandled exceptions and return 500."""
    # Log the exception for debugging
    logger = logging.getLogger(__name__)
    message = f"Unhandled exception: {exc}"
    logger.exception(message)

    if settings.django_debug:
        # In development, return detailed error
        return api.create_response(
            request,
            {
                "message": "Internal server error",
                "error": str(exc),
                "type": type(exc).__name__,
            },
            status=500,
        )
    # In production, return generic error
    return api.create_response(
        request,
        {"message": "Internal server error"},
        status=500,
    )


api.add_router("v1", router_v1)
