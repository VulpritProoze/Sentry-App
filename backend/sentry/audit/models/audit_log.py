"""Audit log model."""

from typing import ClassVar

from common.constants.choices import AuditAction, AuditObjectType
from django.db import models


class AuditLog(models.Model):
    """Audit log model."""

    log_id = models.PositiveIntegerField(primary_key=True)
    object_type = models.CharField(max_length=100, choices=AuditObjectType.choices)
    object_id = models.CharField(max_length=1000)
    audited_at = models.DateTimeField(auto_now_add=True)
    audited_by = models.ForeignKey("User", on_delete=models.CASCADE)
    action = models.CharField(max_length=100, choices=AuditAction.choices)
    data = models.JSONField()

    class Meta:  # noqa: D106
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering: ClassVar[list] = ["-log_id"]
        indexes: ClassVar[list] = [
            models.Index(fields=["object_type"]),
            models.Index(fields=["object_id"]),
            models.Index(fields=["audited_at"]),
            models.Index(fields=["audited_by"]),
        ]

    def __str__(self) -> str:  # noqa: D105
        return f"Audit Log {self.log_id}: {self.object_type}"
