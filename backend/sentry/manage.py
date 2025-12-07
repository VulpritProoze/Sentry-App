"""Django's command-line utility for administrative tasks."""

import os
import sys

from sentry.settings.config import settings


def main():
    """Run administrative tasks."""
    settings_module = settings.django_settings_module

    if settings_module is None:
        print(
            "Error: no DJANGO_SETTINGS_MODULE found. Will NOT start devserver. "
            "Remember to inject environment variables"
            "Check README for more info.",
            file=sys.stderr,
        )
        sys.exit(1)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings_module)

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
