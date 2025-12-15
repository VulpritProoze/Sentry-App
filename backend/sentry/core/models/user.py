"""User model."""

from typing import ClassVar

from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers.user_manager import UserManager


class User(AbstractUser):
    """Custom user model."""

    email = models.EmailField(max_length=254, unique=True)

    REQUIRED_FIELDS: ClassVar[list[None | str]] = []

    first_name = models.CharField(max_length=255)
    middle_name = models.CharField(max_length=255, blank=True)  # Didn't know null is discouraged in Django
    last_name = models.CharField(max_length=255)
    profile_picture = models.ImageField(
        max_length=255,
        upload_to="user/images/profile_pictures/",
        blank=True,
    )

    objects = UserManager()

    class Meta:  # noqa: D106
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering: ClassVar[list] = ["-id"]
        indexes: ClassVar[list] = [
            models.Index(fields=["email"]),
            models.Index(fields=["username"]),
        ]
