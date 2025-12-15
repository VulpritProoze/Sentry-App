"""Custom user manager."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib.auth.models import BaseUserManager

if TYPE_CHECKING:
    from core.models import User


class UserManager(BaseUserManager):
    """Custom user manager."""

    def create_user(
        self,
        username: str | None = None,
        email: str | None = None,
        password: str | None = None,
        **extra_fields: dict[str, Any],
    ) -> User:
        """Create and return a regular user with the given username, email, and password."""
        if not email:
            message = "The Email field must be set"
            raise ValueError(message)
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        username: str | None = None,
        email: str | None = None,
        password: str | None = None,
        **extra_fields: dict[str, Any],
    ) -> User:
        """Create and return a superuser with the given username, email, and password."""
        if "is_staff" not in extra_fields:
            extra_fields["is_staff"] = True  # type: ignore[assignment]
        if "is_superuser" not in extra_fields:
            extra_fields["is_superuser"] = True  # type: ignore[assignment]

        if extra_fields.get("is_staff") is not True:
            message = "Superuser must have is_staff=True."
            raise ValueError(message)
        if extra_fields.get("is_superuser") is not True:
            message = "Superuser must have is_superuser=True."
            raise ValueError(message)

        return self.create_user(username=username, email=email, password=password, **extra_fields)
