"""Error messages organized by domain."""

from .audit.audit_choices import AuditAction, AuditObjectType
from .misc.model_name_choices import ModelNameChoices
from .token import BlacklistableTokenType

__all__ = [
    "AuditAction",
    "AuditObjectType",
    "BlacklistableTokenType",
    "ModelNameChoices",
]


# ============ SAMPLE USAGE =============
# from common.constants.choices import AuditAction, AuditObjectType

# Usage of "choices"

# action = models.CharField(
#     max_length=100,
#     choices=AuditAction.choices,
# )

# Get the "value" of choice
# print(AuditAction.DELETE.value)  # "delete"

# # Get human-readable "label"
# print(AuditAction.USER.label)  # "User"

# ========================================
