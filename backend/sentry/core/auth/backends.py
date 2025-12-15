"""Customized authentication backends."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

from core.models import User

if TYPE_CHECKING:
    from django.http import HttpRequest


class EmailOrUsernameBackend(ModelBackend):
    """Customized authentication backend that allows users to login with email or username."""

    def authenticate(
        self,
        request: HttpRequest | None = None,  # noqa: ARG002
        username: str | None = None,
        email: str | None = None,
        password: str | None = None,
        **_kwargs,  # noqa: ANN003
    ) -> User | None:
        """Authenticate the user by email or username.

        Args:
            request: The HTTP request object (optional)
            username: Username or email to authenticate with
            email: Email to authenticate with (optional, takes precedence over username)
            password: Password to authenticate with
            **_kwargs: Additional keyword arguments

        Returns:
            User instance if authentication succeeds, None otherwise

        """
        if not password:
            return None

        # If username is provided, check if it's actually an email
        # If email is explicitly provided, use that
        lookup_value = email if email else username

        if not lookup_value:
            return None

        try:
            # Check if lookup_value is email format or username
            # Try both username and email fields
            user = User.objects.get(
                Q(username=lookup_value) | Q(email=lookup_value),
            )
        except User.DoesNotExist:  # pyright: ignore[reportAttributeAccessIssue]
            # Run set_password to prevent timing attacks
            User().set_password(password)
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
