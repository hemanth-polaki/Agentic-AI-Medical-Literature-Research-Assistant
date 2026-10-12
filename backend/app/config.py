import os
from pathlib import Path
from typing import List, Union, Any

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    load_dotenv(override=True)
except ImportError:
    pass

try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings  # type: ignore
    except ImportError:
        from pydantic import BaseModel as BaseSettings  # type: ignore

class Settings(BaseSettings):
    PROJECT_NAME: str = "BrightLit AI Agentic Medical Literature Research Assistant"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # LLM Keys (OpenAI / Gemini / Claude)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    # PubMed Scholarly API
    PUBMED_API_KEY: str = os.getenv("PUBMED_API_KEY", "")
    PUBMED_EMAIL: str = os.getenv("PUBMED_EMAIL", "medresearch@agentic.ai")
    
    # Database (PostgreSQL exclusive via postgresql+asyncpg://...)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/brightcone_db")
    
    # Redis for Agent Memory & Cache
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()

class LLMCircuitBreaker:
    """Circuit breaker for Gemini / LLM APIs to immediately fall back to high-accuracy
    rule-based extraction without repeated 429 quota delays."""
    _gemini_exhausted_until: float = 0.0

    @classmethod
    def is_gemini_available(cls) -> bool:
        import time
        return time.time() > cls._gemini_exhausted_until

    @classmethod
    def mark_gemini_exhausted(cls, cooldown_seconds: float = 300.0):
        import time
        cls._gemini_exhausted_until = time.time() + cooldown_seconds
        print(f"[CircuitBreaker] Gemini quota exhausted or rate-limited. Activating fast heuristic fallback for {int(cooldown_seconds)}s.")

