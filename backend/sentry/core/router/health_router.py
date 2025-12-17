"""Health check router."""

from django.http import HttpRequest
from ninja import Router

from core.controllers.health_controller import check_postgres_health

health_router = Router(tags=["health"])


@health_router.get("/postgres/", response={200: dict, 500: dict})
def postgres_health_endpoint(request: HttpRequest) -> dict:
    """PostgreSQL health check endpoint.

    Returns 200 if PostgreSQL is healthy, 500 if unhealthy.
    """
    result = check_postgres_health(request)

    if result["status"] == "healthy":
        return 200, result  # pyright: ignore[reportReturnType]
    return 500, result  # pyright: ignore[reportReturnType]
