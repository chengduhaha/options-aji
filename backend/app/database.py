from sqlmodel import create_engine, Session, SQLModel
from app.config import get_settings

settings = get_settings()

# Create engine with appropriate pool settings for Railway
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False,
)


def init_db() -> None:
    """Create all tables if they don't exist."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    """Yield a database session."""
    with Session(engine) as session:
        yield session
