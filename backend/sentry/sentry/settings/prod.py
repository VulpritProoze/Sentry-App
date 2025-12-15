"""Production settings."""

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
CORS_ALLOWED_ORIGINS = []

# Application definition

INSTALLED_APPS = [
    # "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    # "django.contrib.sessions",
    # "django.contrib.messages",
    # "django.contrib.staticfiles",
    "corsheaders",
    "ninja",
    "core",
    "device",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "ninja.compatibility.files.fix_request_files_middleware",
    # "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    # "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    # "django.contrib.messages.middleware.MessageMiddleware",
    # "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
