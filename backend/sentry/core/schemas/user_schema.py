"""User schema."""

from datetime import datetime

from ninja import Schema


class UserSchema(Schema):
    """User response schema."""

    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    middle_name: str = ""
    profile_picture: str = ""
    is_active: bool
    date_joined: datetime

    class Config:  # noqa: D106
        from_attributes = True  # Pydantic v2 (Django Ninja 1.0+)
