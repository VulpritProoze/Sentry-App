"""Device router."""

from core.auth.api_key import DeviceAPIKeyAuth
from django.http import HttpRequest
from ninja import Router

from device.controllers.device_controller import receive_device_data
from device.schemas import DeviceDataRequest, DeviceDataResponse
from device.router.crash_router import crash_router
from device.router.mobile_router import mobile_router

device_router = Router(tags=["device"], auth=DeviceAPIKeyAuth())


@device_router.post("/data", response=DeviceDataResponse)
def receive_device_data_endpoint(
    request: HttpRequest,
    payload: DeviceDataRequest,
) -> DeviceDataResponse:
    """Endpoint the embedded device can POST MPU6050 data to.

    URL (once wired into v1): /api/v1/device/data
    """
    return receive_device_data(request, payload)


# Register crash router (uses API key auth)
device_router.add_router("crash", crash_router)

# Register mobile router (uses JWT auth for mobile app endpoints)
device_router.add_router("mobile", mobile_router)
