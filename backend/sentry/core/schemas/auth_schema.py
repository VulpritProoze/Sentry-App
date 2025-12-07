"""Authentication schemas."""

from ninja import Schema


class LoginRequest(Schema):
    """Login request schema."""

    username: str
    password: str


class RegisterRequest(Schema):
    """Register request schema."""

    username: str
    email: str
    password: str
    first_name: str
    last_name: str
    middle_name: str = ""


class TokenResponse(Schema):
    """Token response schema."""

    access_token: str
    refresh_token: str
    token_type: str


class RefreshTokenRequest(Schema):
    """Refresh token request schema."""

    refresh_token: str
