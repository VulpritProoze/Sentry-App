"""User model."""

from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers.user_manager import UserManager


class User(AbstractUser):
    """Custom user model."""

    first_name = models.CharField(max_length=255)
    middle_name = models.CharField(max_length=255, blank=True)  # Didn't know null is discouraged in Django
    last_name = models.CharField(max_length=255)

    objects = UserManager()

    class Meta:  # noqa: D106
        verbose_name = "User"
        verbose_name_plural = "Users"
        db_table = "users"
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["username"]),
        ]
