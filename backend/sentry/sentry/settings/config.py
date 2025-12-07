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
    django_allowed_hosts: list[str] = Field(
        default=[],
        description="Comma-separated list of allowed hosts",
    )
    django_settings_module: str = Field(
        default="sentry.settings.dev",
        description="The module to use for Django settings",
    )
    django_cors_allowed_origins: list[str] = Field(
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

    @field_validator(
        "django_allowed_hosts",
        "django_cors_allowed_origins",
        mode="before",
    )
    @classmethod
    def parse_string_to_list(cls, v: str) -> list[str]:
        """Parse a comma-separated string into a list of strings."""
        if not v:
            return []
        return [host.strip() for host in v.split(",") if host.strip()]


settings: Settings = Settings()
