"""JWT authentication."""

from datetime import UTC, datetime, timedelta

from common.constants.messages import AuthMessages, EnvMessages
from django.contrib.auth import get_user_model
from django.http import HttpRequest
from jose import JWTError, jwt
from ninja.errors import AuthenticationError
from ninja.security import HttpBearer
from sentry.settings.config import settings

from core.schemas import UserSchema

User = get_user_model()


class JwtAuth(HttpBearer):
    """JWT authentication."""

    def authenticate(self, request: HttpRequest, token: str) -> int | None:
        """Authenticate the user."""
        try:
            payload = decode_jwt_token(token)

        except AuthenticationError:
            # Re-raise AuthenticationError (from decode_jwt_token or our own)
            raise
        except User.DoesNotExist as e:
            raise AuthenticationError(
                message=AuthMessages.JwtAuth.USER_NOT_FOUND,
            ) from e

        # Get user_id from sub claim (stored as string in JWT)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise AuthenticationError(
                message=f"{AuthMessages.JwtAuth.INVALID_TOKEN} (User ID not found in token)",
            )

        # Convert string user_id back to int for database query
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError) as e:
            raise AuthenticationError(
                message=f"{AuthMessages.JwtAuth.INVALID_TOKEN} (Invalid user ID format)",
            ) from e

        user = User.objects.get(id=user_id)

        if not user.is_active:
            raise AuthenticationError(
                message=f"{AuthMessages.JwtAuth.INACTIVE_USER} (User is inactive)",
            )

        request.user = user  # pyright: ignore[reportAttributeAccessIssue]
        return user_id


class VerifiedJwtAuth(JwtAuth):
    """JWT authentication that requires verified users only.

    This authentication class extends JwtAuth and adds an additional check
    to ensure the user's email is verified (is_verified=True) before
    allowing access to protected routes.
    """

    def authenticate(self, request: HttpRequest, token: str) -> int | None:
        """Authenticate the user and verify they are verified.

        Args:
            request: The HTTP request object
            token: The JWT token string

        Returns:
            User ID if authentication and verification succeed

        Raises:
            AuthenticationError: If user is not verified or authentication fails

        """
        # First, perform standard JWT authentication
        user_id = super().authenticate(request, token)

        # Check if user is verified
        user = request.user  # pyright: ignore[reportAttributeAccessIssue]
        if not user.is_verified:
            raise AuthenticationError(
                message=AuthMessages.JwtAuth.UNVERIFIED_USER,
            )

        return user_id


def decode_jwt_token(token: str) -> dict:
    """Decode the JWT token.

    Args:
        token: The JWT token string to decode

    Returns:
        Dictionary containing the decoded payload

    Raises:
        AuthenticationError: If token is invalid, expired, or malformed

    """
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as e:
        raise AuthenticationError(
            message=AuthMessages.JwtAuth.INVALID_TOKEN,
        ) from e


def create_access_token(data: dict, expires_in_mins: timedelta) -> str:
    """Create an access token."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_in_mins
    to_encode.update({"exp": expire, "type": "access"})
    try:
        decoded_kwt = jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
    except JWTError as e:
        raise AuthenticationError(
            message=AuthMessages.JwtAuth.INVALID_TOKEN,
        ) from e
    return decoded_kwt


def create_refresh_token(data: dict, expires_in_mins: timedelta) -> str:
    """Create a refresh token."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_in_mins
    to_encode.update({"exp": expire, "type": "refresh"})
    try:
        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
    except JWTError as e:
        raise AuthenticationError(
            message=AuthMessages.JwtAuth.INVALID_TOKEN,
        ) from e
    return encoded_jwt


def create_access_token_from_refresh_token(refresh_token_payload: dict) -> str:
    """Create a new access token from refresh token payload.

    Args:
        refresh_token_payload: Decoded refresh token payload

    Returns:
        New access token string

    """
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_in_mins)
    if not access_token_expires:
        raise ValueError(EnvMessages.Jwt.MISSING_ENV_ACCESS_TOKEN_EXPIRE_IN_MINS)

    # sub is already a string from the refresh token payload, so use it directly
    return create_access_token(
        data={"sub": refresh_token_payload.get("sub"), "username": refresh_token_payload.get("username")},
        expires_in_mins=access_token_expires,
    )


def create_token_pair(user: UserSchema) -> dict[str, str]:
    """Create a token pair."""
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_in_mins)
    if not access_token_expires:
        raise ValueError(EnvMessages.Jwt.MISSING_ENV_ACCESS_TOKEN_EXPIRE_IN_MINS)
    # Convert user.id to string (JWT sub claim must be a string)
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username},
        expires_in_mins=access_token_expires,
    )

    refresh_token_expires = timedelta(days=settings.jwt_refresh_token_expire_in_days)
    if not refresh_token_expires:
        raise ValueError(EnvMessages.Jwt.MISSING_ENV_REFRESH_TOKEN_EXPIRE_IN_DAYS)
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "username": user.username},
        expires_in_mins=refresh_token_expires * 24,
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
    }


def create_email_verification_token(user_id: int) -> str:
    """Create an email verification JWT token.

    Args:
        user_id: The user's ID

    Returns:
        JWT token string for email verification

    """
    expires_in = timedelta(
        hours=settings.email_verification_expire_in_hours,
    )  # Email verification tokens expire in 24 hours
    expire = datetime.now(UTC) + expires_in
    to_encode = {
        "sub": str(user_id),
        "type": "email_verification",
        "exp": expire,
    }
    try:
        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
    except JWTError as e:
        raise AuthenticationError(
            message=AuthMessages.JwtAuth.INVALID_TOKEN,
        ) from e
    return encoded_jwt


def create_password_reset_token(user_id: int) -> str:
    """Create a password reset JWT token.

    Args:
        user_id: The user's ID

    Returns:
        JWT token string for password reset

    """
    expires_in = timedelta(hours=settings.password_reset_expire_in_hours)  # Password reset tokens expire in 1 hour
    expire = datetime.now(UTC) + expires_in
    to_encode = {
        "sub": str(user_id),
        "type": "password_reset",
        "exp": expire,
    }
    try:
        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
    except JWTError as e:
        raise AuthenticationError(
            message=AuthMessages.JwtAuth.INVALID_TOKEN,
        ) from e
    return encoded_jwt


def decode_and_verify_email_token(
    token: str,
    expected_type: str,
) -> dict:
    """Decode and verify an email-related JWT token.

    Args:
        token: The JWT token string to decode
        expected_type: Expected token type ("email_verification" or "password_reset")

    Returns:
        Dictionary containing the decoded payload

    Raises:
        AuthenticationError: If token is invalid, expired, or has wrong type

    """
    payload = decode_jwt_token(token)

    # Verify token type matches expected type
    token_type = payload.get("type")
    if token_type != expected_type:
        error_msg = (
            f"{AuthMessages.JwtAuth.INVALID_TOKEN} (Invalid token type: expected {expected_type}, got {token_type})"
        )
        raise AuthenticationError(message=error_msg)

    return payload
