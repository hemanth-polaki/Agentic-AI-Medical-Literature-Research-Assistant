import json
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, String, Text, DateTime
from app.config import settings

Base = declarative_base()

class ReviewRecord(Base):
    __tablename__ = "literature_reviews"
    
    id = Column(String(64), primary_key=True, index=True)
    query = Column(Text, nullable=False)
    status = Column(String(32), default="Searching")
    created_at = Column(DateTime, default=datetime.utcnow)
    data_json = Column(Text, nullable=False)  # stores full LiteratureReviewResponse payload

def get_postgres_url(raw_url: str) -> str:
    """
    Normalizes PostgreSQL connection URL for SQLAlchemy asyncpg driver.
    Strictly enforces PostgreSQL and rejects SQLite.
    """
    url = (raw_url or "").strip()
    if url.startswith("sqlite"):
        raise ValueError(
            "BrightLit AI is configured strictly for PostgreSQL. "
            "SQLite is not supported. Please configure a valid PostgreSQL connection URL (postgresql+asyncpg://...)."
        )
    if not url:
        url = "postgresql+asyncpg://postgres:postgres@localhost:5432/brightcone_db"
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

DATABASE_URL = get_postgres_url(settings.DATABASE_URL)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def init_db():
    """Initializes PostgreSQL tables for literature reviews."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        masked_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
        print(f"[Database] PostgreSQL schema initialized successfully on {masked_url}.")
    except Exception as exc:
        print(f"[Database] PostgreSQL connection notice: {exc}")
        print(f"[Database] To connect: ensure PostgreSQL is running at {DATABASE_URL}")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
