"""Device API key authentication."""

from django.http import HttpRequest
from ninja.errors import AuthenticationError
from ninja.security import APIKeyHeader
from sentry.settings.config import settings


class DeviceAPIKeyAuth(APIKeyHeader):
    """API key authentication for IoT devices."""

    param_name = "X-API-Key"  # Header name where API key is expected

    def authenticate(self, request: HttpRequest, key: str) -> str | None:  # noqa: ARG002
        """Authenticate device using API key.

        Args:
            request: The HTTP request
            key: The API key from header

        Returns:
            The API key if valid, None otherwise

        Raises:
            AuthenticationError: If API key is invalid

        """
        # Get API key from settings
        valid_api_key = getattr(settings, "device_api_key", None)

        if not valid_api_key:
            raise AuthenticationError(message="API key not configured on server.")

        if key == valid_api_key:
            return key

        raise AuthenticationError(message="Invalid API key.")
