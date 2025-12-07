"""Authentication exceptions."""

from ninja.errors import AuthenticationError


class BaseAuthError(AuthenticationError):
    """Base class for authentication errors."""

    default_message: str = "Authentication failed"
    default_code: int = 401

    def __init__(self, code: int | None = None, message: str | None = None) -> None:
        """Initialize authentication error.

        Args:
            message: Human-readable error message
            code: Machine-readable error code

        """
        self.message = message or self.default_message
        self.status_code = code or self.default_code
        super().__init__(self.status_code, self.message)

    def __str__(self) -> str:  # noqa: D105
        return self.message


class InvalidTokenError(BaseAuthError):
    """Raised when JWT token is invalid."""

    default_message = "Invalid or expired token"
    default_code = 401


class InactiveUserError(BaseAuthError):
    """Raised when user account is inactive."""

    default_message = "User account is inactive"
    default_code = 403


class MissingTokenError(BaseAuthError):
    """Raised when JWT token is missing from request."""

    default_message = "Authentication token is required"
    default_code = 401


class ExpiredTokenError(BaseAuthError):
    """Raised when JWT token has expired."""

    default_message = "Token has expired"
    default_code = 401


class UserMissingFromTokenError(BaseAuthError):
    """Raised when user from token doesn't exist."""

    default_message = "User not found"
    default_code = 401
