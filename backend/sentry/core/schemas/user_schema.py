"""User schema."""

from datetime import datetime

from django.contrib.auth import get_user_model
from ninja import Schema
from pydantic import field_validator

User = get_user_model()


class UserSchema(Schema):
    """User schema."""

    id: int
    username: str
    first_name: str
    middle_name: str | None = None
    last_name: str
    profile_picture: str | None = None
    email: str
    is_staff: bool
    is_active: bool
    is_superuser: bool
    last_login: datetime | None = None
    date_joined: datetime


class UserUpdateRequest(Schema):
    """User update request schema."""

    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def reject_none_or_empty(cls, v: str | None) -> str | None:
        """Reject None or empty string values for required fields."""
        if v is None:
            msg = "This field cannot be None. Omit the field if you don't want to update it."
            raise ValueError(msg)
        if isinstance(v, str) and v.strip() == "":
            msg = "This field cannot be empty. Omit the field if you don't want to update it."
            raise ValueError(msg)
        return v
