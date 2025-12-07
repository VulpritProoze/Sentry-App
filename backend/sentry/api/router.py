"""Main API router configuration."""

from ninja import NinjaAPI
from sentry.settings.config import settings

from .v1.router import router_v1
from .v2.router import router_v2

api = NinjaAPI(
    title="Sentry API",
    version="1.0.0",
    description="API for Sentry, a crash-detection IoT device attachable to helmets to help riders inform loved ones in times of emergency",  # noqa: E501
    docs_url="/api/docs" if settings.django_debug else None,
    openapi_url="/api/openapi.json" if settings.django_debug else None,
)

api.add_router("v1", router_v1)
api.add_router("v2", router_v2)
