"""File utility functions."""

import secrets
import string
from pathlib import Path

from common.constants.choices import ModelNameChoices


def generate_image_filename(
    model_name: ModelNameChoices,
    model_id: int | str,
    file_extension: str | None = None,
) -> str:
    """Generate a standardized image filename in the format.

    "{model_name}-{model_id}:{hash}.{extension}".

    Format breakdown:
    - model_name: The model name from ModelNameChoices (e.g., "User", "AuditLog")
    - model_id: The model's primary key (will be truncated if too long, minimum 16 chars kept)
    - hash: A random 16-character alphanumeric hash
    - extension: Original file extension (e.g., ".jpg", ".png")

    Args:
        model_name: A ModelNameChoices enum value representing the model type
        model_id: The model's primary key (integer or string)
        file_extension: Optional file extension (e.g., ".jpg", ".png").
                       If None, defaults to ".jpg"

    Returns:
        A filename string in the format: "{model_name}-{model_id}:{hash}.{extension}"

    Example:
        >>> from common.constants.choices import ModelNameChoices
        >>> filename = generate_image_filename(ModelNameChoices.USER, 12345, ".jpg")
        >>> # Returns: "User-12345:a1b2c3d4e5f6g7h8.jpg"

    Notes:
        - The model_id will be truncated if the total filename would exceed reasonable limits,
          but at least 16 characters of the ID will be preserved
        - The hash is cryptographically secure and ensures uniqueness
        - File extension is normalized (lowercase, with leading dot if missing)

    """
    # Convert model_id to string
    model_id_str = str(model_id)

    # Normalize file extension
    if file_extension is None:
        file_extension = ".jpg"
    else:
        # Ensure extension starts with dot and is lowercase
        file_extension = file_extension.lower()
        if not file_extension.startswith("."):
            file_extension = f".{file_extension}"

    # Generate 16-character random hash (alphanumeric)
    # Using secrets module for cryptographically secure random generation
    alphabet = string.ascii_letters + string.digits
    hash_value = "".join(secrets.choice(alphabet) for _ in range(16))

    # Get model name value (e.g., "User" or "AuditLog")
    model_name_value = model_name.value

    # Calculate maximum length for model_id
    # Format: "{model_name}-{model_id}:{hash}.{extension}"
    # Reserve space for: model_name + "-" + ":" + hash (16) + extension + some buffer
    # Assuming max filename length of 255 (common database limit)
    # Reserve: model_name + "-" + ":" + hash (16) + extension + buffer = ~50 chars
    max_total_length = 255
    reserved_length = len(model_name_value) + 1 + 1 + 16 + len(file_extension) + 10  # buffer
    max_id_length = max_total_length - reserved_length

    # Ensure model_id is at least 16 characters if truncation is needed
    # But if max_id_length is less than 16, use max_id_length
    min_id_length = min(16, max_id_length)

    # Truncate model_id if necessary, but keep at least min_id_length characters
    if len(model_id_str) > max_id_length:
        # Keep the last min_id_length characters (most significant part of ID)
        model_id_str = model_id_str[-min_id_length:]

    # Construct filename
    return f"{model_name_value}-{model_id_str}:{hash_value}{file_extension}"


def get_file_extension(filename: str) -> str:
    """Extract file extension from a filename.

    Args:
        filename: The filename or path

    Returns:
        The file extension with leading dot (e.g., ".jpg", ".png")

    Example:
        >>> get_file_extension("image.jpg")
        ".jpg"
        >>> get_file_extension("/path/to/file.png")
        ".png"

    """
    ext = Path(filename).suffix
    return ext.lower() or ".jpg"
