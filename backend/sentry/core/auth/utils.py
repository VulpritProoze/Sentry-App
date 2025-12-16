"""Authentication utilities."""

import logging
from datetime import UTC, datetime

from common.constants.choices import BlacklistableTokenType
from common.constants.messages import AuthMessages
from django.http import HttpRequest
from jose import JWTError, jwt
from ninja.errors import AuthenticationError, HttpError
from sentry.settings.config import settings

from core.auth.jwt import decode_jwt_token
from core.models import User
from core.models.tokens import TokenBlacklist


def validate_access_token(access_token_str: str) -> None:
    """Validate access token and check if it's expired.

    Args:
        access_token_str: The access token string

    Raises:
        HttpError: If access token is not expired (400)
        AuthenticationError: If access token is invalid

    """
    try:
        access_payload = decode_jwt_token(access_token_str)
        # Check if access token type is correct
        if access_payload.get("type") != "access":
            raise AuthenticationError(
                message=AuthMessages.JwtAuth.INVALID_TOKEN,
            )

        # Check if access token is expired
        exp = access_payload.get("exp")
        if exp:
            exp_datetime = datetime.fromtimestamp(exp, tz=UTC)
            if exp_datetime > datetime.now(UTC):
                # Access token is NOT expired - return bad request
                raise HttpError(
                    status_code=400,
                    message="Access token is not expired. No need to refresh.",
                )
    except JWTError:
        # Access token is expired or invalid - this is expected, continue
        pass


def get_access_token_from_header(request: HttpRequest) -> str | None:
    """Extract access token from Authorization header.

    Args:
        request: The HTTP request object

    Returns:
        Access token string if present, None otherwise

    """
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "")
    return None


def validate_refresh_token_payload(refresh_payload: dict) -> str:
    """Validate refresh token payload and extract user ID.

    Args:
        refresh_payload: Decoded refresh token payload

    Returns:
        User ID as string

    Raises:
        AuthenticationError: If token type is invalid or user ID not found

    """
    # Verify it's a refresh token
    token_type = refresh_payload.get("type")
    if token_type != "refresh":  # noqa: S105
        raise AuthenticationError(
            message=f"{AuthMessages.JwtAuth.INVALID_TOKEN} (Invalid token type: {token_type})",
        )

    # Get user ID from refresh token
    user_id = refresh_payload.get("sub")
    if not user_id:
        raise AuthenticationError(
            status_code=404,
            message=f"{AuthMessages.JwtAuth.INVALID_TOKEN} (User ID not found in refresh token)",
        )

    return user_id


def get_user_from_refresh_token(user_id: str) -> User:
    """Get and validate user from refresh token user ID.

    Args:
        user_id: User ID from refresh token

    Returns:
        User instance

    Raises:
        HttpError: If user not found
        AuthenticationError: If user is inactive

    """
    try:
        user = User.objects.get(id=user_id)  # pyright: ignore[reportAttributeAccessIssue]
    except User.DoesNotExist as e:  # pyright: ignore[reportAttributeAccessIssue]
        raise HttpError(
            status_code=404,
            message=AuthMessages.JwtAuth.USER_NOT_FOUND,
        ) from e

    # Check if user is active
    if not user.is_active:
        raise AuthenticationError(
            message=f"{AuthMessages.JwtAuth.INACTIVE_USER} (User is inactive)",
        )

    return user


def blacklist_refresh_token(token: str, expires_at: datetime) -> None:
    """Blacklist a refresh token.

    Args:
        token: The refresh token string
        expires_at: Token expiration datetime

    """
    TokenBlacklist.blacklist_token(
        token=token,
        token_type=BlacklistableTokenType.REFRESH,
        expires_at=expires_at,
        is_manually_blacklisted=False,
    )


def blacklist_expired_refresh_token(token: str) -> None:
    """Attempt to blacklist an expired or invalid refresh token.

    Tries to decode the token without verification to extract expiration time.
    If decoding fails, silently continues (token may be malformed).

    Args:
        token: The refresh token string

    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"verify_signature": False, "verify_exp": False},
        )
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            expires_at = datetime.fromtimestamp(exp_timestamp, tz=UTC)
            blacklist_refresh_token(token, expires_at)
    except (JWTError, ValueError, TypeError) as e:
        # If we can't decode, log and continue
        logger = logging.getLogger("core")
        logger.debug("Could not decode refresh token for blacklisting: %s", e)
