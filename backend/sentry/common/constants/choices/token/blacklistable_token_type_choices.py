"""Blacklistable token type choices.

These are token types that can be blacklisted. Access tokens are excluded
as they are short-lived and don't need blacklisting.
"""

from django.db import models


class BlacklistableTokenType(models.TextChoices):
    """Blacklistable token type constants for JWT tokens.

    Note: Access tokens are not included as they are short-lived
    and automatically expire, making blacklisting unnecessary.
    """

    REFRESH = "refresh", "Refresh"  # pyright: ignore[reportAssignmentType]
    EMAIL_VERIFICATION = "email_verification", "Email Verification"  # pyright: ignore[reportAssignmentType]
    PASSWORD_RESET = "password_reset", "Password Reset"  # pyright: ignore[reportAssignmentType]

