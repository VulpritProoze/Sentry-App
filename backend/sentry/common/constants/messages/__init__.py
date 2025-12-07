"""Error messages organized by domain."""

from .general_messages import GeneralMessages
from .core.auth_messages import AuthMessages

__all__ = [
    "GeneralMessages",
    "AuthMessages",
]

# ============ SAMPLE USAGE =============
# from common.constants.messages import GeneralMessages, AuthMessages
#
# # 1. Using in API Responses
# @router.post("/login")
# def login(request, credentials: LoginSchema):
#     if not user:
#         return Response(
#             {"message": AuthMessages.Login.WRONG_CREDS},
#             status=401
#         )
#     return {"message": AuthMessages.Login.SUCCESS}
#
# # 2. Using in Error Handling
# if not resource:
#     return Response(
#         {"message": GeneralMessages.RESOURCE_NOT_FOUND},
#         status=404
#     )
# ========================================
