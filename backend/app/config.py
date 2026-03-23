"""
Quantora AI — Application Configuration
========================================
Uses pydantic-settings to load config from environment variables or .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──
    database_url: str = "sqlite+aiosqlite:///./quantora.db"

    # ── JWT Auth ──
    jwt_secret: str = "quantora-enterprise-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480  # 8 hours

    # ── CORS ──
    # Plain string so pydantic-settings never tries to JSON-parse it.
    # Set CORS_ORIGINS env var as comma-separated URLs.
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    # ── App ──
    app_name: str = "Quantora AI"
    debug: bool = False
    seed_data: bool = False  # Set to True to enable seed data on startup

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def get_cors_list(self) -> list[str]:
        """Split the comma-separated CORS_ORIGINS string into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
