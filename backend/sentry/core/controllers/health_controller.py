"""Health check controller."""

import logging
from typing import Any

from django.db import connection
from django.db.utils import DatabaseError, OperationalError
from django.http import HttpRequest

logger = logging.getLogger(__name__)


def check_postgres_health(request: HttpRequest) -> dict[str, Any]:
    """Check PostgreSQL database health.

    Args:
        request: The HTTP request object

    Returns:
        Dictionary containing health status and details

    Raises:
        HTTPException: If database is unhealthy (500 status)
    """
    try:
        # Try to execute a simple query to check database connectivity
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()

        if result and result[0] == 1:
            # Get database connection info
            db_name = connection.settings_dict.get("NAME", "unknown")
            db_host = connection.settings_dict.get("HOST", "unknown")
            db_port = connection.settings_dict.get("PORT", "unknown")

            logger.info(
                f"PostgreSQL health check passed - DB: {db_name}, Host: {db_host}:{db_port}",
            )

            return {
                "status": "healthy",
                "database": {
                    "name": db_name,
                    "host": db_host,
                    "port": db_port,
                },
                "message": "PostgreSQL is healthy and responding",
            }

        # If query didn't return expected result
        logger.error("PostgreSQL health check failed - unexpected query result")
        return {
            "status": "unhealthy",
            "message": "PostgreSQL query returned unexpected result",
        }

    except OperationalError as e:
        logger.error(f"PostgreSQL health check failed - OperationalError: {e}")
        return {
            "status": "unhealthy",
            "message": f"PostgreSQL connection error: {str(e)}",
            "error": "operational_error",
        }

    except DatabaseError as e:
        logger.error(f"PostgreSQL health check failed - DatabaseError: {e}")
        return {
            "status": "unhealthy",
            "message": f"PostgreSQL database error: {str(e)}",
            "error": "database_error",
        }

    except Exception as e:
        logger.error(f"PostgreSQL health check failed - Unexpected error: {e}")
        return {
            "status": "unhealthy",
            "message": f"Unexpected error during health check: {str(e)}",
            "error": "unknown_error",
        }

