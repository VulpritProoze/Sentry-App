"""Authentication messages."""

from typing import Final


class AuthMessages:
    """Authentication messages."""

    class Login:
        """Login messages."""

        SUCCESS: Final[str] = "Login successful."
        EITHER_CREDS: Final[str] = "Either username or email must exist."
        WRONG_CREDS: Final[str] = "Incorrect credentials. Are you sure you inputted the right username or email?"
        WRONG_PASSWORD: Final[str] = "Incorrect password."  # noqa: S105
        INACTIVE_USER: Final[str] = "User is inactive. Please contact support."

    class Register:
        """Register messages."""

        SUCCESS: Final[str] = "Registration successful."
        USER_EXISTS: Final[str] = "User already exists. Please login instead."

    class RefreshToken:
        """Refresh token messages."""

        SUCCESS: Final[str] = "Token refreshed successfully."

    class Logout:
        """Logout messages."""

        SUCCESS: Final[str] = "Logout successful."
        FAILED: Final[str] = "Logout failed. Please try again."

    class JwtAuth:
        """JWT Authentication messages."""

        USER_NOT_FOUND: Final[str] = "User not found from the token payload."
        INVALID_TOKEN: Final[str] = "Invalid token. Either the token is expired or invalid."  # noqa: S105
        INACTIVE_USER: Final[str] = "User is inactive. Please contact support."
        UNVERIFIED_USER: Final[str] = "User is not verified. Please verify your email to access this resource."

    class EmailVerification:
        """Email verification messages."""

        EMAIL_SENT: Final[str] = "Verification email sent successfully."
        EMAIL_VERIFIED: Final[str] = "Email verified successfully."
        ALREADY_VERIFIED: Final[str] = "Email is already verified."

    class PasswordReset:
        """Password reset messages."""

        EMAIL_SENT: Final[str] = "Password reset email sent successfully."
        PASSWORD_RESET: Final[str] = "Password reset successfully."  # noqa: S105
