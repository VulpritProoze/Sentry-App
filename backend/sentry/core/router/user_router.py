"""User router."""

from typing import Any

from django.http import HttpRequest
from ninja import File, Router
from ninja.files import UploadedFile

from core.auth.jwt import JwtAuth
from core.controllers.user_controller import (
    get_user_info,
    update_user_info,
    update_user_profile_picture,
)
from core.schemas import UserUpdateRequest

user_router = Router(tags=["user"])


@user_router.get("/me/info", auth=JwtAuth())
def user_info_endpoint(
    request: HttpRequest,
) -> dict[str, Any]:
    """Get current user information endpoint."""
    return get_user_info(request)


@user_router.put("/me/update", auth=JwtAuth())
def update_user_endpoint(
    request: HttpRequest,
    data: UserUpdateRequest,
) -> dict[str, Any]:
    """Update current user's information endpoint."""
    return update_user_info(request, data)


@user_router.put("/me/profile-picture/update", auth=JwtAuth())
def update_profile_picture_endpoint(
    request: HttpRequest,
    profile_picture: File[UploadedFile],
) -> dict[str, Any]:
    """Update current user's profile picture endpoint."""
    return update_user_profile_picture(request, profile_picture)
