"""Auth router."""

import logging
from typing import Any

from django.http import HttpRequest
from ninja import Router

from core.auth.jwt import JwtAuth
from core.controllers.auth_controller import (
    forgot_password_controller,
    is_user_authenticated,
    is_user_verified,
    login,
    refresh_token,
    register,
    reset_password_controller,
    send_verification_email_controller,
    verify_email_controller,
)
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
    VerifyEmailRequest,
)

auth_router = Router(tags=["auth"])


@auth_router.post("/login")
def login_endpoint(
    request: HttpRequest,
    credentials: LoginRequest,
) -> LoginResponse:
    """Login endpoint."""
    logger = logging.getLogger("core")

    # Log request body/credentials
    logger.info("=== LOGIN ENDPOINT REQUEST BODY ===")
    logger.info("Username: '%s'", credentials.username)
    logger.info("Email: '%s'", credentials.email)
    logger.info("Password present: %s", bool(credentials.password))
    logger.info("===================================")

    return login(request, credentials)


@auth_router.post("/register")
def register_endpoint(
    request: HttpRequest,
    data: RegisterRequest,
) -> LoginResponse:
    """Register endpoint."""
    return register(request, data)


@auth_router.post("/refresh")
def refresh_token_endpoint(
    request: HttpRequest,
    data: RefreshTokenRequest,
) -> LoginResponse:
    """Refresh token endpoint."""
    return refresh_token(request, data)


@auth_router.get("/me", auth=JwtAuth())
def is_user_authenticated_endpoint(
    request: HttpRequest,
) -> dict[str, Any]:
    """Check if user is authenticated."""
    return is_user_authenticated(request)


@auth_router.get("/me/is-verified", response=IsUserVerifiedResponse, auth=JwtAuth())
def is_user_verified_endpoint(
    request: HttpRequest,
) -> IsUserVerifiedResponse:
    """Check if user is verified."""
    return is_user_verified(request)  # pyright: ignore[reportAttributeAccessIssue]


@auth_router.post("/email/send-verification-email", response=MessageResponse)
def send_verification_email_endpoint(
    request: HttpRequest,
    data: EmailVerificationRequest,
) -> MessageResponse:
    """Send email verification email."""
    return send_verification_email_controller(request, data)


@auth_router.post("/email/verify", response=MessageResponse)
def verify_email_endpoint(
    request: HttpRequest,
    data: VerifyEmailRequest,
) -> MessageResponse:
    """Verify email address."""
    return verify_email_controller(request, data)


@auth_router.post("/email/forgot-password", response=MessageResponse)
def forgot_password_endpoint(
    request: HttpRequest,
    data: ForgotPasswordRequest,
) -> MessageResponse:
    """Send password reset email."""
    return forgot_password_controller(request, data)


@auth_router.post("/email/reset-password", response=MessageResponse)
def reset_password_endpoint(
    request: HttpRequest,
    data: ResetPasswordRequest,
) -> MessageResponse:
    """Reset password."""
    return reset_password_controller(request, data)
