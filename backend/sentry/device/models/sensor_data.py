"""Sensor data model."""

from typing import ClassVar

from core.models import User
from django.db import models


class SensorData(models.Model):
    """Sensor data model."""

    device_id = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    ax = models.FloatField()
    ay = models.FloatField()
    az = models.FloatField()
    roll = models.FloatField()
    pitch = models.FloatField()
    tilt_detected = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:  # noqa: D106
        ordering: ClassVar[list[str]] = ["-timestamp"]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=["device_id", "-timestamp"]),
        ]

    def __str__(self):  # noqa: ANN204, D105
        return f"Sensor data for {self.device_id} at {self.timestamp}"
