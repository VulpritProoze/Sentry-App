"""Management command to create initial superuser from environment variables."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from sentry.settings.config import settings

User = get_user_model()


class Command(BaseCommand):
    """Creates initial superuser from environment variables."""

    help = "Creates initial superuser from environment variables"

    def handle(self, *_args: tuple, **_options: dict) -> None:
        """Handle the command execution."""
        username = settings.admin_username
        email = settings.admin_email
        password = settings.admin_password

        if not username or not email or not password:
            message = "ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD not set!"
            raise CommandError(message)

        # Check if superuser already exists by username or email
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(  # type: ignore[attr-defined]
                    f'User with username "{username}" already exists!',
                ),
            )
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(  # type: ignore[attr-defined]
                    f'User with email "{email}" already exists!',
                ),
            )
            return

        # Create superuser with required fields
        # User model requires first_name and last_name
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name=username,  # Use username as first_name if not provided
            last_name="Admin",  # Default last_name
        )

        self.stdout.write(
            self.style.SUCCESS(  # type: ignore[attr-defined]
                f'Superuser "{username}" created successfully.',
            ),
        )
