"""Crash router."""

import logging

from django.http import HttpRequest
from ninja import Router

from core.auth.api_key import DeviceAPIKeyAuth
from device.controllers.crash_controller import process_crash_alert
from device.schemas.crash_schema import CrashAlertRequest, CrashAlertResponse

logger = logging.getLogger("device")

crash_router = Router(tags=["crash"], auth=DeviceAPIKeyAuth())


@crash_router.post("/alert", response=CrashAlertResponse)
def crash_alert_endpoint(
    request: HttpRequest,
    payload: CrashAlertRequest,
) -> CrashAlertResponse:
    """Endpoint for mobile app to send threshold-triggered crash alerts.

    This is called when Tier 1 (client-side) detects threshold exceeded.
    Backend performs Tier 2 (AI analysis) and responds with confirmation.

    URL: /api/v1/device/crash/alert
    """
    logger.info(
        "[IN] POST /api/v1/device/crash/alert - Crash alert endpoint called (device_id=%s, timestamp=%s)",
        payload.device_id,
        payload.timestamp,
    )
    try:
        response = process_crash_alert(request, payload)
        logger.info(
            "[OK] POST /api/v1/device/crash/alert - Successfully processed (device_id=%s, is_crash=%s)",
            payload.device_id,
            response.is_crash,
        )
        return response
    except Exception as e:
        logger.error(
            "[ERROR] POST /api/v1/device/crash/alert - Error processing crash alert (device_id=%s)",
            payload.device_id,
            exc_info=True,
        )
        raise

