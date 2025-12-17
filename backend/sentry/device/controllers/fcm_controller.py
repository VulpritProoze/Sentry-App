"""FCM token registration controller."""

import logging

from django.db import transaction
from django.http import HttpRequest
from ninja.errors import HttpError

from device.models import DeviceToken
from device.schemas.fcm_schema import FCMTokenRequest, FCMTokenResponse

logger = logging.getLogger("device")


def register_fcm_token(
    request: HttpRequest,
    data: FCMTokenRequest,
) -> FCMTokenResponse:
    """Register or update FCM token for a device.

    Args:
        request: HTTP request object (should have authenticated user)
        data: FCM token registration data

    Returns:
        FCMTokenResponse with success status

    Raises:
        HttpError: If registration fails

    """
    try:
        user = request.user if hasattr(request, "user") and request.user.is_authenticated else None  # type: ignore[attr-defined]

        with transaction.atomic():  # type: ignore[call-overload]
            # Try to find existing token for this device_id and fcm_token combination
            device_token, created = DeviceToken.objects.get_or_create(  # type: ignore[attr-defined]
                device_id=data.device_id,
                fcm_token=data.fcm_token,
                defaults={
                    "user": user,
                    "platform": data.platform,
                    "is_active": True,
                },
            )

            if not created:
                # Update existing token
                device_token.user = user  # type: ignore[attr-defined]
                device_token.platform = data.platform  # type: ignore[attr-defined]
                device_token.is_active = True  # type: ignore[attr-defined]
                device_token.save(update_fields=["user", "platform", "is_active", "updated_at"])

            logger.info(
                "FCM token %s for device %s (platform: %s, user: %s)",
                "registered" if created else "updated",
                data.device_id,
                data.platform,
                user.id if user else "anonymous",  # type: ignore[attr-defined]
            )

            return FCMTokenResponse(
                success=True,
                message=f"FCM token {'registered' if created else 'updated'} successfully",
            )

    except Exception:
        logger.exception("Error registering FCM token")
        raise HttpError(status_code=500, message="Failed to register FCM token") from None
