"""Core controller."""

import contextlib
from typing import Any

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction
from django.http import HttpRequest

from core.schemas import UserSchema, UserUpdateRequest

User = get_user_model()


def update_user_info(
    request: HttpRequest,
    data: UserUpdateRequest,
) -> dict[str, Any]:
    """Update user information.

    Args:
        request: The HTTP request object
        data: The user update data

    Returns:
        Dictionary containing the success/error message

    Raises:
        ValidationError: If email already exists

    """
    user_id = request.user.id  # pyright: ignore[reportAttributeAccessIssue]

    # Update fields if provided - use update() for efficiency
    update_data = data.model_dump(exclude_unset=True, exclude_none=True)
    if update_data:
        User.objects.filter(id=user_id).update(**update_data)

    return {
        "message": "User information updated successfully",
    }


def update_user_profile_picture(
    request: HttpRequest,
    profile_picture: UploadedFile,
) -> dict[str, Any]:
    """Update user profile picture.

    Args:
        request: The HTTP request object
        profile_picture: The profile picture file to upload

    Returns:
        Dictionary containing the success/error message

    """
    user_id = request.user.id  # pyright: ignore[reportAttributeAccessIssue]

    # Get the ImageField's storage and upload_to path
    profile_picture_field = User._meta.get_field("profile_picture")  # noqa: SLF001
    storage = profile_picture_field.storage
    upload_to = profile_picture_field.upload_to  # "user/images/profile_pictures/"

    # Wrap everything in an atomic transaction
    with transaction.atomic():  # type: ignore[call-overload]
        # Fetch only the profile_picture field value (efficient - minimal query)
        user_data = User.objects.filter(id=user_id).values("profile_picture").first()
        current_picture_path = user_data.get("profile_picture") if user_data else None

        # Delete old picture if it exists
        if current_picture_path:
            with contextlib.suppress(Exception):
                storage.delete(str(current_picture_path))

        # Generate the file path Django would use
        # upload_to is a static string, not a callable
        file_path = f"{upload_to}{profile_picture.name}"

        # Ensure unique filename if needed
        filename = storage.get_available_name(file_path, None)

        # Save the new file using Django's storage
        saved_path = storage.save(filename, profile_picture)

        # Update only the profile_picture field in the database (bulk update, no instance fetch!)
        User.objects.filter(id=user_id).update(profile_picture=saved_path)

    return {
        "message": "Profile picture updated successfully",
    }


def get_user_info(request: HttpRequest) -> dict[str, Any]:
    """Get current user information.

    Args:
        request: The HTTP request object (contains authenticated user via request.user)

    Returns:
        Dictionary containing the current user information

    """
    user_id = request.user.id  # pyright: ignore[reportAttributeAccessIssue]

    # Fetch fresh user object from database
    user = User.objects.get(id=user_id)

    # Convert to UserSchema and return as dict
    user_schema = UserSchema.model_validate(user)
    return {
        "message": "User information fetched successfully",
        "user": user_schema.model_dump(),
    }
