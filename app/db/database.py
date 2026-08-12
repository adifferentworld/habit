from typing import AsyncGenerator
from urllib.parse import urlparse, parse_qs
import ssl as ssl_module
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

class Base(DeclarativeBase):
    pass

def create_engine_instance():
    db_url = settings.async_database_url
    raw_url = settings.DATABASE_URL
    connect_args = {}
    
    if db_url.startswith("postgresql"):
        needs_ssl = False
        try:
            parsed = urlparse(raw_url)
            query_params = parse_qs(parsed.query)
            sslmode = query_params.get("sslmode", [None])[0]
            ssl_param = query_params.get("ssl", [None])[0]
            
            if sslmode in ["require", "prefer", "verify-ca", "verify-full"] or ssl_param in ["true", "1", "require"]:
                needs_ssl = True
            elif "neon.tech" in raw_url or "supabase" in raw_url:
                needs_ssl = True
        except Exception:
            if "neon.tech" in raw_url or "sslmode" in raw_url or "ssl" in raw_url:
                needs_ssl = True

        if needs_ssl:
            ssl_ctx = ssl_module.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl_module.CERT_NONE
            connect_args["ssl"] = ssl_ctx

    return create_async_engine(
        db_url,
        echo=False,
        future=True,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        connect_args=connect_args,
    )

engine = create_engine_instance()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
