"""Development settings."""

from .base import (
    AUTH_PASSWORD_VALIDATORS,
    AUTH_USER_MODEL,
    AUTHENTICATION_BACKENDS,
    BASE_DIR,
    DATABASES,
    DEBUG,
    DEFAULT_AUTO_FIELD,
    LANGUAGE_CODE,
    MEDIA_ROOT,
    MEDIA_URL,
    ROOT_URLCONF,
    SECRET_KEY,
    TEMPLATES,
    TIME_ZONE,
    USE_I18N,
    USE_TZ,
    WSGI_APPLICATION,
)
from .config import settings

ALLOWED_HOSTS = settings.django_allowed_hosts

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = settings.django_cors_allowed_origins

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = "static/"


# Application definition


INSTALLED_APPS = [
    # "django.contrib.admin",
    "core",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",  # Dev only
    # "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "ninja",
    "device",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",  # Dev only
    "ninja.compatibility.files.fix_request_files_middleware",
    "django.middleware.common.CommonMiddleware",
    # "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    # "django.contrib.messages.middleware.MessageMiddleware",
    # "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# Email configuration
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

# Validate required email settings
required_email_settings = {
    "EMAIL_HOST": settings.email_host,
    "EMAIL_PORT": settings.email_port,
    "EMAIL_USE_TLS": settings.email_use_tls,
    "EMAIL_USE_SSL": settings.email_use_ssl,
    "EMAIL_HOST_USER": settings.email_host_user,
    "EMAIL_HOST_PASSWORD": settings.email_host_password,
    "DEFAULT_FROM_EMAIL": settings.default_from_email,
}

missing_settings = [name for name, value in required_email_settings.items() if value is None]
if missing_settings:
    error_message = f"Missing required email environment variables: {', '.join(missing_settings)}"
    raise ValueError(error_message)

EMAIL_HOST = required_email_settings["EMAIL_HOST"]
EMAIL_PORT = required_email_settings["EMAIL_PORT"]
EMAIL_USE_TLS = required_email_settings["EMAIL_USE_TLS"]
EMAIL_USE_SSL = required_email_settings["EMAIL_USE_SSL"]
EMAIL_HOST_USER = required_email_settings["EMAIL_HOST_USER"]
EMAIL_HOST_PASSWORD = required_email_settings["EMAIL_HOST_PASSWORD"]
DEFAULT_FROM_EMAIL = required_email_settings["DEFAULT_FROM_EMAIL"]

# Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Logging configuration
# https://docs.djangoproject.com/en/5.1/topics/logging/
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "filters": {
        "require_debug_true": {
            "()": "django.utils.log.RequireDebugTrue",
        },
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "sentry.log",
            "maxBytes": 1024 * 1024 * 10,  # 10 MB
            "backupCount": 5,
            "formatter": "verbose",
        },
        "device_file": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "device.log",
            "maxBytes": 1024 * 1024 * 10,  # 10 MB
            "backupCount": 5,
            "formatter": "verbose",
        },
        "core_file": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "core.log",
            "maxBytes": 1024 * 1024 * 10,  # 10 MB
            "backupCount": 5,
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console", "file"],
            "level": "ERROR",
            "propagate": False,
        },
        "device": {
            "handlers": ["console", "device_file"],
            "level": "INFO",
            "propagate": False,
        },
        "core": {
            "handlers": ["console", "core_file"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
