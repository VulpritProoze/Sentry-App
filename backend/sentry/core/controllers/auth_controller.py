"""Auth router controller."""

from typing import Any

from common.constants.messages import AuthMessages
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from django.http import HttpRequest
from jose import JWTError
from ninja.errors import AuthenticationError, HttpError, ValidationError

from core.auth.jwt import (
    create_access_token_from_refresh_token,
    create_token_pair,
    decode_jwt_token,
)
from core.auth.utils import get_access_token_from_header, validate_access_token
from core.schemas import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RegisterRequest,
    UserSchema,
)

User = get_user_model()


def login(
    request: HttpRequest,
    credentials: LoginRequest,
) -> LoginResponse:
    """Login controller.

    Args:
        request (HttpRequest): The request object
        credentials (LoginRequest): The credentials of the user to login

    Returns:
        A dictionary containing the access token and refresh token

    """
    identifier = credentials.username or credentials.email

    if not identifier:
        raise AuthenticationError(
            message=AuthMessages.Login.EITHER_CREDS,
        )

    user = authenticate(request, username=identifier, password=credentials.password)

    if not user:
        raise AuthenticationError(
            message=AuthMessages.Login.WRONG_CREDS,
        )

    if not user.is_active:
        raise AuthenticationError(
            message=AuthMessages.Login.INACTIVE_USER,
        )

    user_schema = UserSchema.model_validate(user)
    try:
        tokens = create_token_pair(user_schema)
    except ValueError as e:
        raise HttpError(
            status_code=500,
            message=str(e),
        ) from e
    return LoginResponse(**tokens)


def register(
    _request: HttpRequest,
    data: RegisterRequest,
) -> LoginResponse:
    """Register controller.

    Args:
        _request (HttpRequest): The request object (unused but required by Django Ninja)
        data (RegisterRequest): The registration data

    Returns:
        A dictionary containing the access token and refresh token

    Raises:
        HttpError: If user already exists

    """
    # Check if user already exists (single database query)
    existing_user = (
        User.objects.filter(
            Q(username=data.username) | Q(email=data.email),
        )
        .values_list("username", "email")
        .first()
    )

    if existing_user:
        errors = []
        username, email = existing_user
        if username == data.username:
            errors.append(
                {
                    "field": "username",
                    "message": AuthMessages.Register.USER_EXISTS,
                },
            )
        if email == data.email:
            errors.append(
                {
                    "field": "email",
                    "message": AuthMessages.Register.USER_EXISTS,
                },
            )
        raise ValidationError(errors=errors)

    # Create new user
    user_data = data.model_dump(exclude={"password"})
    user = User.objects.create_user(
        password=data.password,
        **user_data,
    )

    # Generate tokens for the newly registered user
    user_schema = UserSchema.model_validate(user)
    tokens = create_token_pair(user_schema)
    return LoginResponse(**tokens)


def refresh_token(
    request: HttpRequest,
    data: RefreshTokenRequest,
) -> LoginResponse:
    """Refresh token controller.

    Flow:
    1. Get refresh token from request
    2. Validate access token (from Authorization header) - if not expired, return 400
    3. Validate refresh token - if expired, return 404 (user must login)
    4. If authenticated and access token expired, create new access token from refresh token
    5. Return old refresh token + new access token

    Args:
        request (HttpRequest): The request object (contains Authorization header)
        data (RefreshTokenRequest): The refresh token request data

    Returns:
        A dictionary containing the new access token and old refresh token

    Raises:
        HttpError: If access token not expired (400) or refresh token expired (404)
        AuthenticationError: If tokens are invalid or user not authenticated

    """
    # Step 1: Get refresh token from credentials
    refresh_token_str = data.refresh_token

    # Step 2: Validate access token from Authorization header (if present)
    access_token_str = get_access_token_from_header(request)
    if access_token_str:
        validate_access_token(access_token_str)

    # Step 2 (continued): Validate refresh token
    try:
        refresh_payload = decode_jwt_token(refresh_token_str)

        # Verify it's a refresh token
        token_type = refresh_payload.get("type")
        if token_type != "refresh":  # noqa: S105
            raise AuthenticationError(
                message=f"{AuthMessages.JwtAuth.INVALID_TOKEN} (Invalid token type: {token_type})",
            )

        # Check if refresh token is expired (decode_jwt_token raises if expired)
        # If we get here, refresh token is valid

        # Step 4: Get user ID from refresh token
        user_id = refresh_payload.get("sub")
        if not user_id:
            raise AuthenticationError(
                status_code=404,
                message=f"{AuthMessages.JwtAuth.INVALID_TOKEN} (User ID not found in refresh token)",
            )

        # Get user from database
        user = User.objects.get(id=user_id)

        # Check if user is active
        if not user.is_active:
            raise AuthenticationError(
                message=f"{AuthMessages.JwtAuth.INACTIVE_USER} (User is inactive)",
            )

        # Step 5: Create new access token from refresh token
        new_access_token = create_access_token_from_refresh_token(refresh_payload)

        # Step 6: Return old refresh token + new access token
        return LoginResponse(
            access_token=new_access_token,
            refresh_token=refresh_token_str,  # Return the same refresh token
            token_type="Bearer",  # noqa: S106
        )

    except JWTError:
        # Step 2: Refresh token expired or invalid - return 404
        raise HttpError(
            status_code=404,
            message=f"{AuthMessages.JwtAuth.INVALID_TOKEN} (Refresh token expired or invalid)",
        ) from None
    except User.DoesNotExist:
        raise HttpError(
            status_code=404,
            message=AuthMessages.JwtAuth.USER_NOT_FOUND,
        ) from None


def get_current_user(request: HttpRequest) -> dict[str, Any]:  # noqa: ARG001
    """Get current authenticated user.

    Args:
        request: The HTTP request object
        user: The authenticated user from JWT token (injected by Django Ninja)

    Returns:
        UserSchema of the current authenticated user

    """
    return {
        "message": "User is currently authenticated",
    }
