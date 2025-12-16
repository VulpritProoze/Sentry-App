"""Token blacklist model."""

from typing import ClassVar

from django.db import models
from django.utils import timezone

from common.constants.choices import BlacklistableTokenType


class TokenBlacklist(models.Model):
    """Token blacklist model.

    Stores blacklisted tokens to prevent their use after expiration
    or manual blacklisting. Supports refresh tokens, email verification
    tokens, and password reset tokens.

    Note: Access tokens are not blacklisted as they are short-lived
    and automatically expire.
    """

    token = models.TextField(
        unique=True,
        help_text="The JWT token string (stored for blacklist checking)",
    )
    token_type = models.CharField(
        max_length=50,
        choices=BlacklistableTokenType.choices,
        help_text="Type of token (refresh, email_verification, password_reset)",
    )
    is_manually_blacklisted = models.BooleanField(
        default=False,  # pyright: ignore[reportArgumentType]
        help_text="Whether this token was manually blacklisted (vs expired)",
    )
    expires_at = models.DateTimeField(
        help_text="Token expiration time from JWT 'exp' claim",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this token was added to the blacklist",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this blacklist entry was last updated",
    )

    class Meta:  # noqa: D106
        verbose_name = "Token Blacklist"
        verbose_name_plural = "Token Blacklist"
        ordering: ClassVar[list[str]] = ["-created_at"]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=["token"]),
            models.Index(fields=["token_type"]),
            models.Index(fields=["expires_at"]),
            models.Index(fields=["token_type", "expires_at"]),
        ]

    def __str__(self) -> str:  # noqa: D105
        return f"{self.token_type} token (expires: {self.expires_at})"

    @property
    def is_expired(self) -> bool:
        """Check if the token has expired."""
        return timezone.now() >= self.expires_at

    @classmethod
    def is_token_blacklisted(cls, token: str) -> bool:
        """Check if a token is blacklisted.

        Args:
            token: The JWT token string to check

        Returns:
            True if token is blacklisted, False otherwise
        """
        return cls.objects.filter(token=token).exists()

    @classmethod
    def blacklist_token(
        cls,
        token: str,
        token_type: str,
        expires_at: timezone.datetime,
        is_manually_blacklisted: bool = False,
    ) -> "TokenBlacklist":
        """Add a token to the blacklist.

        Args:
            token: The JWT token string
            token_type: Type of token (from BlacklistableTokenType)
            expires_at: Token expiration datetime
            is_manually_blacklisted: Whether manually blacklisted

        Returns:
            TokenBlacklist instance
        """
        blacklist_entry, created = cls.objects.get_or_create(
            token=token,
            defaults={
                "token_type": token_type,
                "expires_at": expires_at,
                "is_manually_blacklisted": is_manually_blacklisted,
            },
        )
        return blacklist_entry

