"""Email utilities for sending emails via Brevo SMTP."""

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from sentry.settings.config import settings as app_settings


def send_email(
    subject: str,
    recipient_email: str,
    html_template: str,
    context: dict | None = None,
) -> bool:
    """Send an email.

    Args:
        subject: Email subject
        recipient_email: Recipient email address
        html_template: Path to HTML template
        context: Template context variables

    Returns:
        True if email was sent successfully, False otherwise

    """
    if context is None:
        context = {}

    # Add default context
    context.setdefault("web_url", getattr(app_settings, "web_url", "http://localhost:4321"))
    context.setdefault("api_url", getattr(app_settings, "api_url", "http://localhost:8000"))
    context.setdefault("site_name", "Sentry")
    context.setdefault("debug", settings.DEBUG)
    context.setdefault(
        "email_verification_expire_in_hours",
        getattr(app_settings, "email_verification_expire_in_hours", 24),
    )
    context.setdefault(
        "password_reset_expire_in_hours",
        getattr(app_settings, "password_reset_expire_in_hours", 1),
    )

    try:
        # Render HTML template
        html_message = render_to_string(html_template, context)
        plain_message = strip_tags(html_message)

        # Send email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception:  # noqa: BLE001
        return False
    else:
        return True


def send_verification_email(user_email: str, token: str, user_name: str = "") -> bool:
    """Send email verification email.

    Args:
        user_email: User's email address
        token: Email verification JWT token
        user_name: User's display name (optional)

    Returns:
        True if email was sent successfully, False otherwise

    """
    web_url = getattr(app_settings, "web_url", "http://localhost:4321")
    verification_url = f"{web_url}/verify-email?token={token}"
    return send_email(
        subject="Verify Your Email Address",
        recipient_email=user_email,
        html_template="emails/email_verification.html",
        context={
            "user_name": user_name,
            "verification_url": verification_url,
            "token": token,
        },
    )


def send_password_reset_email(user_email: str, token: str, user_name: str = "") -> bool:
    """Send password reset email.

    Args:
        user_email: User's email address
        token: Password reset JWT token
        user_name: User's display name (optional)

    Returns:
        True if email was sent successfully, False otherwise

    """
    web_url = getattr(app_settings, "web_url", "http://localhost:4321")
    reset_url = f"{web_url}/reset-password?token={token}"
    return send_email(
        subject="Reset Your Password",
        recipient_email=user_email,
        html_template="emails/password_reset.html",
        context={
            "user_name": user_name,
            "reset_url": reset_url,
            "token": token,
        },
    )
