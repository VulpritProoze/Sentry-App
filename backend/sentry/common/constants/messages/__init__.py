"""Error messages organized by domain."""

from .general_messages import GeneralMessages
from .core.auth_messages import AuthMessages

__all__ = [
    "GeneralMessages",
    "AuthMessages",
]
