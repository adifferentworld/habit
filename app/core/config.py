from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/habit_todo_db"
    JWT_SECRET_KEY: str = "supersecretkey_replace_this_in_production_123456789"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def jwt_algorithm(self) -> str:
        alg = (self.JWT_ALGORITHM or "HS256").strip().upper()
        if alg in ("H256", "HS", "HS-256"):
            return "HS256"
        valid_algs = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384", "ES512"]
        if alg not in valid_algs:
            return "HS256"
        return alg

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("sqlite://"):
            url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)

        try:
            parsed = urlparse(url)
            if parsed.scheme.startswith("postgresql"):
                query_params = parse_qs(parsed.query)
                # Known libpq or unsupported params that cause asyncpg connect() TypeError
                unsupported_params = {
                    "sslmode", "ssl", "channel_binding", "gssencmode",
                    "target_session_attrs", "options", "sslrootcert",
                    "sslcert", "sslkey", "sslpassword", "sslcrl",
                    "service", "application_name", "connect_timeout",
                    "keepalives", "keepalives_idle", "keepalives_interval",
                    "keepalives_count"
                }
                removed = False
                for key in list(query_params.keys()):
                    if key.lower() in unsupported_params:
                        del query_params[key]
                        removed = True
                if removed:
                    new_query = urlencode(query_params, doseq=True)
                    parsed = parsed._replace(query=new_query)
                    url = urlunparse(parsed)
        except Exception:
            pass

        return url

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS or self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
