"""Pydantic settings for the application."""

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    django_secret_key: str = Field(
        default="django-insecure-dpye4@30zoa@&^q(os%b9$uetkf3bvi9nk*)08@fnf+v)7z9r*",
        description="The secret key used by Django to secure the application",
    )
    django_debug: bool = Field(
        default=True,
        description="Whether Django is in debug mode",
    )
    django_allowed_hosts: str | list[str] = Field(
        default=[],
        description="Comma-separated list of allowed hosts",
    )
    django_settings_module: str = Field(
        default="sentry.settings.dev",
        description="The module to use for Django settings",
    )
    django_cors_allowed_origins: str | list[str] = Field(
        default=[],
        description="Comma-separated list of allowed origins",
    )
    jwt_secret_key: str = Field(
        default="foolproof-bunny-hop-i-am-a-jwt-token-pen",
        description="The secret key used by JWT to sign tokens",
    )
    jwt_algorithm: str = Field(
        default="HS256",
        description="The algorithm used by JWT to sign tokens",
    )
    jwt_access_token_expire_in_mins: int = Field(
        default=60,
        description="The expiry time of JWT Access Token in minutes",
    )
    jwt_refresh_token_expire_in_days: int = Field(
        default=7,
        description="The expiry time of JWT Refresh Token in days",
    )
    database_url: str | None = Field(
        default=None,
        description="The URL of the database to use",
    )
    admin_username: str | None = Field(
        default=None,
        description="The username of the admin user",
    )
    admin_email: str | None = Field(
        default=None,
        description="The email of the admin user",
    )
    admin_password: str | None = Field(
        default=None,
        description="The password of the admin user",
    )
    email_host: str | None = Field(
        default=None,
        description="The email host to use",
    )
    email_port: int | None = Field(
        default=None,
        description="The email port to use",
    )
    email_host_user: str | None = Field(
        default=None,
        description="The email host user to use",
    )
    email_host_password: str | None = Field(
        default=None,
        description="The email host password to use",
    )
    email_use_tls: bool | None = Field(
        default=None,
        description="Whether to use TLS for email",
    )
    email_use_ssl: bool | None = Field(
        default=None,
        description="Whether to use SSL for email",
    )
    default_from_email: str | None = Field(
        default=None,
        description="The default from email to use",
    )
    email_verification_expire_in_hours: int = Field(
        default=24,
        description="The expiry time of email verification token in hours",
    )
    password_reset_expire_in_hours: int = Field(
        default=1,
        description="The expiry time of password reset token in hours",
    )
    api_url: str = Field(
        default="http://localhost:8000",
        description="The URL of the API",
    )
    web_url: str = Field(
        default="http://localhost:4321",
        description="The URL of the frontend web application",
    )
    device_api_key: str | None = Field(
        default=None,
        description="The API key for the device",
    )

    @field_validator(
        "django_allowed_hosts",
        "django_cors_allowed_origins",
        mode="before",
    )
    @classmethod
    def parse_string_to_list(cls, v: str | list[str] | None) -> list[str]:
        """Parse a comma-separated string into a list of strings."""
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if not v or v.strip() == "":
            return []
        return [host.strip() for host in v.split(",") if host.strip()]


settings: Settings = Settings()
