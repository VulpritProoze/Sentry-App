"""FCM token registration schemas."""

from pydantic import BaseModel, Field


class FCMTokenRequest(BaseModel):
    """Request schema for FCM token registration."""

    fcm_token: str = Field(..., description="Expo push token (FCM compatible)")
    device_id: str = Field(..., description="Device identifier")
    platform: str = Field(..., description="Platform: 'ios' or 'android'", pattern="^(ios|android)$")


class FCMTokenResponse(BaseModel):
    """Response schema for FCM token registration."""

    success: bool = Field(..., description="Whether the registration was successful")
    message: str = Field(..., description="Response message")
