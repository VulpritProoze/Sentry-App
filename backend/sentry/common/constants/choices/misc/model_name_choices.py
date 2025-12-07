"""Model name choices."""

from django.db import models


class ModelNameChoices(models.TextChoices):
    """Model name choices.

    Use choices.USER.label for example.
    """

    USER = "user", "User"  # pyright: ignore[reportAssignmentType]
    AUDIT_LOG = "audit_log", "Audit Log"  # pyright: ignore[reportAssignmentType]
