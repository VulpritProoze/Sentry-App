"""JWT authentication."""

from datetime import UTC, datetime, timedelta

from common.exceptions import InactiveUserError, InvalidTokenError
from django.contrib.auth import get_user_model
from django.http import HttpRequest
from jose import JWTError, jwt
from ninja.security import HttpBearer
from sentry.settings.config import settings

from core.schemas import UserSchema

User = get_user_model()


class JwtAuth(HttpBearer):
    """JWT authentication."""

    def authenticate(self, _request: HttpRequest, token: str) -> UserSchema | None:
        """Authenticate the user."""
        try:
            payload = decode_jwt_token(token)
            user_id = payload.get("sub")

            if not user_id:
                raise InvalidTokenError

            user = User.objects.get(id=user_id)
            if not user.is_active:
                raise InactiveUserError

            return UserSchema.model_validate(user)

        except User.DoesNotExist as ue:
            raise InvalidTokenError from ue
        except JWTError as e:
            raise InvalidTokenError from e


def decode_jwt_token(token: str) -> dict:
    """Decode the JWT token."""
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create an access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.jwt_access_token_expire_in_mins,
        )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            days=settings.jwt_refresh_token_expire_in_days,
        )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_token_pair(user: UserSchema) -> dict[str, str]:
    """Create a token pair."""
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_in_mins)
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username},
        expires_delta=access_token_expires,
    )

    refresh_token_expires = timedelta(days=settings.jwt_refresh_token_expire_in_days)
    refresh_token = create_refresh_token(
        data={"sub": user.id, "username": user.username},
        expires_delta=refresh_token_expires,
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
    }
