"""Crash controller."""

import logging

from core.ai.gemini_service import GeminiService
from django.db import transaction
from django.http import HttpRequest
from ninja.errors import HttpError

from device.models import CrashEvent
from device.schemas.crash_schema import CrashAlertRequest, CrashAlertResponse
from device.services.crash_detector import CrashDetectorService
from device.services.fcm_service import FCMService
from device.utils.crash_utils import notify_loved_ones_with_gps

logger = logging.getLogger("device")


def process_crash_alert(
    request: HttpRequest,
    data: CrashAlertRequest,
) -> CrashAlertResponse:
    """Process crash alert from mobile app (Tier 1 trigger).

    Flow:
    1. Receive threshold alert from mobile app
    2. Retrieve recent sensor data context
    3. Call Gemini AI for analysis
    4. Create CrashEvent if confirmed
    5. Send FCM push notification

    Args:
        request: HTTP request object
        data: Crash alert request data

    Returns:
        Crash alert response with AI analysis

    Raises:
        HttpError: If processing fails

    """
    try:
        # Log incoming crash alert request
        gps_info = (
            f"GPS: fix={data.gps_data.fix},"
            f"lat={data.gps_data.latitude},"
            f"lng={data.gps_data.longitude},"
            f"satellites={data.gps_data.satellites}"
            if data.gps_data
            else "GPS: no data"
        )
        logger.info(
            "[IN] Crash alert received | device_id=%s | timestamp=%s | "
            "threshold_severity=%s | trigger_type=%s | g_force=%.2fg | "
            "sensor: ax=%.2f, ay=%.2f, az=%.2f | roll=%.1f deg, pitch=%.1f deg | "
            "tilt_detected=%s | %s",
            data.device_id,
            data.timestamp,
            data.threshold_result.severity,
            data.threshold_result.trigger_type,
            data.threshold_result.g_force,
            data.sensor_reading.ax,
            data.sensor_reading.ay,
            data.sensor_reading.az,
            data.sensor_reading.roll,
            data.sensor_reading.pitch,
            data.sensor_reading.tilt_detected,
            gps_info,
        )

        # Initialize services
        gemini_service = GeminiService()
        crash_detector = CrashDetectorService()
        fcm_service = FCMService()

        # Retrieve recent sensor data (last 30 seconds)
        recent_data = crash_detector.get_recent_sensor_data(
            device_id=data.device_id,
            lookback_seconds=30,
        )
        logger.info(
            "[DATA] Retrieved %s sensor data points for context (device_id=%s)",
            len(recent_data),
            data.device_id,
        )

        # Prepare current reading dict
        current_reading = {
            "ax": data.sensor_reading.ax,
            "ay": data.sensor_reading.ay,
            "az": data.sensor_reading.az,
            "roll": data.sensor_reading.roll,
            "pitch": data.sensor_reading.pitch,
            "tilt_detected": data.sensor_reading.tilt_detected,
        }

        # Call Gemini AI for analysis
        logger.info("[AI] Calling Gemini AI for crash analysis (device_id=%s)", data.device_id)
        ai_analysis = gemini_service.analyze_crash_data(
            sensor_data=recent_data,
            current_reading=current_reading,
            context_seconds=30,
        )
        logger.info(
            "[OK] AI analysis complete | device_id=%s | is_crash=%s | confidence=%.2f | "
            "severity=%s | crash_type=%s | false_positive_risk=%.2f | reasoning=%s...",
            data.device_id,
            ai_analysis["is_crash"],
            ai_analysis["confidence"],
            ai_analysis["severity"],
            ai_analysis["crash_type"],
            ai_analysis["false_positive_risk"],
            ai_analysis["reasoning"][:100],
        )

        # Create CrashEvent if confirmed
        crash_event = None
        if ai_analysis["is_crash"]:
            logger.info(
                "[CRASH] Crash confirmed by AI - creating CrashEvent (device_id=%s, severity=%s, confidence=%.2f)",
                data.device_id,
                ai_analysis["severity"],
                ai_analysis["confidence"],
            )
            with transaction.atomic():  # type: ignore[call-overload]
                # Extract GPS data if available
                gps_latitude = None
                gps_longitude = None
                gps_altitude = None
                gps_fix = False
                gps_satellites = None

                if data.gps_data and data.gps_data.fix:
                    gps_latitude = data.gps_data.latitude
                    gps_longitude = data.gps_data.longitude
                    gps_altitude = data.gps_data.altitude
                    gps_fix = data.gps_data.fix
                    gps_satellites = data.gps_data.satellites
                    logger.info(
                        "[GPS] GPS location available: (%s, %s) with %s satellites (device_id=%s)",
                        gps_latitude,
                        gps_longitude,
                        gps_satellites,
                        data.device_id,
                    )
                else:
                    logger.warning("[WARN] No GPS fix available at crash time (device_id=%s)", data.device_id)

                crash_event = CrashEvent.objects.create(  # type: ignore[attr-defined]
                    device_id=data.device_id,
                    user=request.user if hasattr(request, "user") and request.user.is_authenticated else None,  # type: ignore[attr-defined]
                    crash_timestamp=data.timestamp,
                    is_confirmed_crash=True,
                    confidence_score=ai_analysis["confidence"],
                    severity=ai_analysis["severity"],
                    crash_type=ai_analysis["crash_type"],
                    ai_reasoning=ai_analysis["reasoning"],
                    key_indicators=ai_analysis["key_indicators"],
                    false_positive_risk=ai_analysis["false_positive_risk"],
                    max_g_force=data.threshold_result.g_force,
                    impact_acceleration={
                        "ax": data.sensor_reading.ax,
                        "ay": data.sensor_reading.ay,
                        "az": data.sensor_reading.az,
                    },
                    final_tilt={
                        "roll": data.sensor_reading.roll,
                        "pitch": data.sensor_reading.pitch,
                    },
                    # GPS fields
                    crash_latitude=gps_latitude,
                    crash_longitude=gps_longitude,
                    crash_altitude=gps_altitude,
                    gps_fix_at_crash=gps_fix,
                    satellites_at_crash=gps_satellites,
                )
                logger.info(
                    "[SAVE] CrashEvent created successfully | crash_event_id=%s | device_id=%s | "
                    "severity=%s | confidence=%.2f",  # type: ignore[attr-defined]
                    crash_event.id,  # type: ignore[attr-defined]
                    data.device_id,
                    ai_analysis["severity"],
                    ai_analysis["confidence"],
                )

                # Send FCM push notification
                if ai_analysis["severity"] in ["high", "medium"]:
                    logger.info(
                        "[FCM] Sending FCM push notification (device_id=%s, severity=%s, crash_event_id=%s)",  # type: ignore[attr-defined]
                        data.device_id,
                        ai_analysis["severity"],
                        crash_event.id,  # type: ignore[attr-defined]
                    )
                    notification_sent = fcm_service.send_crash_notification(
                        device_id=data.device_id,
                        crash_event=crash_event,
                        ai_analysis=ai_analysis,
                    )
                    if notification_sent:
                        logger.info("[OK] FCM notification sent successfully (device_id=%s)", data.device_id)
                    else:
                        logger.warning("[WARN] FCM notification failed to send (device_id=%s)", data.device_id)

                    # Send GPS location to loved ones
                    logger.info(
                        "[LOVED_ONES] Notifying loved ones with GPS location (device_id=%s, crash_event_id=%s)",  # type: ignore[attr-defined]
                        data.device_id,
                        crash_event.id,  # type: ignore[attr-defined]
                    )
                    notify_loved_ones_with_gps(
                        device_id=data.device_id,
                        crash_event=crash_event,
                    )
        else:
            logger.info(
                "[OK] False positive detected by AI - no crash event created "
                "(device_id=%s, confidence=%.2f, false_positive_risk=%.2f)",
                data.device_id,
                ai_analysis["confidence"],
                ai_analysis["false_positive_risk"],
            )

        logger.info(
            "[OUT] Crash alert processing complete | device_id=%s | is_crash=%s | "
            "crash_event_created=%s | crash_event_id=%s",  # type: ignore[attr-defined]
            data.device_id,
            ai_analysis["is_crash"],
            crash_event is not None,
            crash_event.id if crash_event else None,  # type: ignore[attr-defined]
        )

        return CrashAlertResponse(
            is_crash=ai_analysis["is_crash"],
            confidence=ai_analysis["confidence"],
            severity=ai_analysis["severity"],
            crash_type=ai_analysis["crash_type"],
            reasoning=ai_analysis["reasoning"],
            key_indicators=ai_analysis["key_indicators"],
            false_positive_risk=ai_analysis["false_positive_risk"],
        )

    except Exception:
        logger.exception("Error processing crash alert")
        raise HttpError(status_code=500, message="Failed to process crash alert") from None
