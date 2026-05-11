import os
from functools import lru_cache


class Settings:
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./gex.db")

    # API Security
    API_KEY: str = os.getenv("API_KEY", "dev-key-change-me")

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://options-aji.vercel.app")

    # Data refresh interval (minutes)
    REFRESH_INTERVAL: int = int(os.getenv("REFRESH_INTERVAL", "5"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Mock mode for local dev (auto-fallback when yfinance fails)
    MOCK_MODE: bool = os.getenv("MOCK_MODE", "1") == "1"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
