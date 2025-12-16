"""Auth router controller."""

import logging
from typing import Any

from common.constants.messages import AuthMessages
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from django.http import HttpRequest
from jose import JWTError
from ninja.errors import AuthenticationError, HttpError, ValidationError

from core.auth.jwt import (
    create_access_token_from_refresh_token,
    create_email_verification_token,
    create_password_reset_token,
    create_token_pair,
    decode_and_verify_email_token,
    decode_jwt_token,
)
from core.auth.utils import get_access_token_from_header, validate_access_token
from core.schemas import (
    EmailVerificationRequest,
    ForgotPasswordRequest,
    IsUserVerifiedResponse,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserSchema,
    VerifyEmailRequest,
)
from core.utils.email_utils import send_password_reset_email, send_verification_email

User = get_user_model()

logger = logging.getLogger(__name__)


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
    tokens["message"] = AuthMessages.Login.SUCCESS
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

    # Create new user (unverified until email is verified)
    user_data = data.model_dump(exclude={"password"})
    user = User.objects.create_user(
        password=data.password,
        is_verified=False,  # User must verify email before verification
        **user_data,
    )

    # Send verification email
    token = create_email_verification_token(user.id)
    user_name = f"{user.first_name} {user.last_name}".strip() or user.username
    send_verification_email(
        user_email=user.email,
        token=token,
        user_name=user_name,
    )

    # Generate tokens for the newly registered user
    user_schema = UserSchema.model_validate(user)
    tokens = create_token_pair(user_schema)
    tokens["message"] = AuthMessages.Register.SUCCESS
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
            message=AuthMessages.RefreshToken.SUCCESS,
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


def is_user_authenticated(request: HttpRequest) -> dict[str, Any]:
    """Check if user is authenticated.

    Args:
        request: The HTTP request object

    Returns:
        A dictionary containing the message

    """
    if not request.user:  # pyright: ignore[reportAttributeAccessIssue]
        raise AuthenticationError(
            message="User is not authenticated",
        )
    return {
        "message": "User is currently authenticated",
    }


def is_user_verified(request: HttpRequest) -> IsUserVerifiedResponse:
    """Check if user is verified.

    Args:
        request: The HTTP request object

    Returns:
        IsUserVerifiedResponse containing the message

    """
    if not request.user:  # pyright: ignore[reportAttributeAccessIssue]
        return IsUserVerifiedResponse(
            is_verified=False,
            message="User is not authenticated",
        )
    return IsUserVerifiedResponse(
        is_verified=request.user.is_verified,  # pyright: ignore[reportAttributeAccessIssue]
        message="User is verified" if request.user.is_verified else "User is not verified",  # pyright: ignore[reportAttributeAccessIssue]
    )


def send_verification_email_controller(
    _request: HttpRequest,
    data: EmailVerificationRequest,
) -> MessageResponse:
    """Send email verification email.

    Args:
        _request: The request object
        data: Email verification request data

    Returns:
        Message response

    """
    try:
        user = User.objects.get(email=data.email)
    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        return MessageResponse(message=AuthMessages.EmailVerification.EMAIL_SENT)

    if user.is_active:
        return MessageResponse(message=AuthMessages.EmailVerification.ALREADY_VERIFIED)

    # Create verification token
    token = create_email_verification_token(user.id)

    # Send email
    user_name = f"{user.first_name} {user.last_name}".strip() or user.username
    send_verification_email(
        user_email=user.email,
        token=token,
        user_name=user_name,
    )

    return MessageResponse(message=AuthMessages.EmailVerification.EMAIL_SENT)


def verify_email_controller(
    _request: HttpRequest,
    data: VerifyEmailRequest,
) -> MessageResponse:
    """Verify email address.

    Args:
        _request: The request object
        data: Verify email request data

    Returns:
        Message response

    Raises:
        HttpError: If token is invalid or expired
        AuthenticationError: If token validation fails

    """
    try:
        payload = decode_and_verify_email_token(
            token=data.token,
            expected_type="email_verification",
        )
    except AuthenticationError as e:
        raise HttpError(
            status_code=404,
            message=AuthMessages.JwtAuth.INVALID_TOKEN,
        ) from e

    # Get user ID from token
    user_id = payload.get("sub")
    if not user_id:
        raise HttpError(
            status_code=404,
            message=AuthMessages.JwtAuth.USER_NOT_FOUND,
        )

    try:
        user = User.objects.get(id=int(user_id))
    except (ValueError, User.DoesNotExist) as e:
        raise HttpError(
            status_code=404,
            message=AuthMessages.JwtAuth.USER_NOT_FOUND,
        ) from e

    # Verify user
    user.is_verified = True
    user.save(update_fields=["is_verified"])

    return MessageResponse(message=AuthMessages.EmailVerification.EMAIL_VERIFIED)


def forgot_password_controller(
    _request: HttpRequest,
    data: ForgotPasswordRequest,
) -> MessageResponse:
    """Send password reset email.

    Args:
        _request: The request object
        data: Forgot password request data

    Returns:
        Message response

    """
    try:
        user = User.objects.get(email=data.email, is_active=True)
    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        return MessageResponse(message=AuthMessages.PasswordReset.EMAIL_SENT)

    # Create password reset token
    token = create_password_reset_token(user.id)

    # Send email
    user_name = f"{user.first_name} {user.last_name}".strip() or user.username
    send_password_reset_email(
        user_email=user.email,
        token=token,
        user_name=user_name,
    )

    return MessageResponse(message=AuthMessages.PasswordReset.EMAIL_SENT)


def reset_password_controller(
    _request: HttpRequest,
    data: ResetPasswordRequest,
) -> MessageResponse:
    """Reset password.

    Args:
        _request: The request object
        data: Reset password request data

    Returns:
        Message response

    Raises:
        HttpError: If token is invalid or expired
        AuthenticationError: If token validation fails

    """
    try:
        payload = decode_and_verify_email_token(
            token=data.token,
            expected_type="password_reset",
        )
    except AuthenticationError as e:
        raise HttpError(
            status_code=404,
            message=AuthMessages.JwtAuth.INVALID_TOKEN,
        ) from e

    # Get user ID from token
    user_id = payload.get("sub")
    if not user_id:
        raise HttpError(
            status_code=404,
            message=AuthMessages.JwtAuth.USER_NOT_FOUND,
        )

    try:
        user = User.objects.get(id=int(user_id))
    except (ValueError, User.DoesNotExist) as e:
        raise HttpError(
            status_code=404,
            message=AuthMessages.JwtAuth.USER_NOT_FOUND,
        ) from e

    # Update password
    try:
        validate_password(data.new_password)
    except ValidationError as e:
        raise HttpError(
            status_code=400,
            message=str(e),
        ) from e

    user.set_password(data.new_password)
    user.save(update_fields=["password"])

    return MessageResponse(message=AuthMessages.PasswordReset.PASSWORD_RESET)
