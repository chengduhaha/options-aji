import asyncio
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import gex, market
from app.scheduler import refresh_all, start_scheduler

settings = get_settings()

# Configure logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events.
    NOTE: refresh_all() runs in a background task so it doesn't block
    the event loop and health checks.
    """
    logger.info("Initializing database...")
    init_db()
    logger.info("Database ready")

    # Start scheduler first so it can run subsequent jobs
    logger.info("Starting scheduler...")
    start_scheduler(settings.REFRESH_INTERVAL)

    # Run initial refresh in a background thread to avoid blocking startup
    logger.info("Running initial data refresh (background)...")
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, refresh_all)

    yield

    logger.info("Shutting down scheduler...")
    from app.scheduler import scheduler
    scheduler.shutdown()


app = FastAPI(
    title="OptionsAji Backend",
    description="GEX calculation and market data API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS - allow frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(gex.router)
app.include_router(market.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
