"""Audit log choices."""

from django.db import models


class AuditAction(models.TextChoices):
    """Audit action types."""

    CREATE = "create", "Create"  # pyright: ignore[reportAssignmentType]
    UPDATE = "update", "Update"  # pyright: ignore[reportAssignmentType]
    DELETE = "delete", "Delete"  # pyright: ignore[reportAssignmentType]
    RESTORE = "restore", "Restore"  # pyright: ignore[reportAssignmentType]


class AuditObjectType(models.TextChoices):
    """Audit object types (model names)."""

    USER = "User", "User"  # pyright: ignore[reportAssignmentType]
