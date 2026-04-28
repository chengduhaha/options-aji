import logging
from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import Session

from app.database import engine
from app.services.yahoo_service import get_option_chain
from app.services.gex_calculator import calculate_gex_profile, calculate_market_data
from app.services.storage_service import store_gex_snapshot, store_market_quote

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


SYMBOLS = ["SPY", "QQQ"]


def refresh_symbol(symbol: str) -> None:
    """Fetch and store latest data for a single symbol."""
    logger.info(f"Refreshing data for {symbol}")
    try:
        with Session(engine) as session:
            calls, puts, expiration, price = get_option_chain(symbol)
            if calls is None or puts is None or price is None:
                logger.warning(f"No data for {symbol}")
                return

            profile = calculate_gex_profile(calls, puts, expiration, price, symbol)
            store_gex_snapshot(session, profile)

            market = calculate_market_data(symbol, price, calls, puts)
            store_market_quote(session, market)

            logger.info(f"Stored GEX profile for {symbol}: net_gex={profile['netGex']}, regime={profile['regime']}")
    except Exception as e:
        logger.error(f"Failed to refresh {symbol}: {e}")


def refresh_all() -> None:
    """Refresh all tracked symbols."""
    for symbol in SYMBOLS:
        refresh_symbol(symbol)


def start_scheduler(interval_minutes: int = 5) -> None:
    """Start background data refresh scheduler."""
    scheduler.add_job(refresh_all, "interval", minutes=interval_minutes, id="refresh_all", replace_existing=True)
    scheduler.start()
    logger.info(f"Scheduler started with {interval_minutes}min interval")
