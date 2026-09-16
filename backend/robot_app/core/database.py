"""
Database setup using SQLAlchemy.
Supports SQLite (default) — swap DATABASE_URL env var for PostgreSQL.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from robot_app.core.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
_CONNECT_ARGS = {}
if "sqlite" in settings.database_url:
    _CONNECT_ARGS = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=_CONNECT_ARGS,
    echo=settings.debug,
)

# Enable WAL mode for SQLite (better concurrent reads)
if "sqlite" in settings.database_url:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):  # noqa: ARG001
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Base ORM class
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Dependency for FastAPI routes
# ---------------------------------------------------------------------------
def get_db():
    """Yield a DB session and close it after the request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables() -> None:
    """Create all tables. Called at startup."""
    Base.metadata.create_all(bind=engine)
