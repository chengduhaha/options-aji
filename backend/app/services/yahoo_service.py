import os
import logging
from typing import Optional, Tuple
import yfinance as yf
import pandas as pd
import requests
import numpy as np

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
USE_MOCK = settings.MOCK_MODE

# Configure yfinance session with proper headers to avoid 403/blocking
_session = requests.Session()
_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})


def _generate_mock_chain(symbol: str) -> Tuple[pd.DataFrame, pd.DataFrame, str, float]:
    """Generate a realistic mock option chain for local testing."""
    base_prices = {"SPY": 548.32, "QQQ": 452.18}
    price = base_prices.get(symbol, 100.0)

    from datetime import datetime, timedelta
    today = datetime.now()
    # Next Friday
    days_until_friday = (4 - today.weekday()) % 7
    if days_until_friday == 0:
        days_until_friday = 7
    next_friday = today + timedelta(days=days_until_friday)
    expiration = next_friday.strftime("%Y-%m-%d")

    # Generate strikes around price
    step = 5 if price > 400 else 2.5 if price > 100 else 1
    center = round(price / step) * step
    strikes = [center + i * step for i in range(-15, 16)]

    rows = []
    for s in strikes:
        dist = abs(s - price) / price
        # Realistic IV smile
        iv = 0.15 + dist * 0.5 + np.random.normal(0, 0.02)
        iv = max(0.05, iv)

        # OI concentrated near ATM
        oi = int(50000 * np.exp(-dist * 10) + np.random.exponential(5000))

        # Volume
        vol = int(oi * 0.3 + np.random.exponential(1000))

        # Last price (rough BS approximation)
        intrinsic = max(0, price - s)
        time_value = price * iv * 0.5
        last_price = max(0.01, intrinsic + time_value + np.random.normal(0, 0.5))

        rows.append({
            "strike": s,
            "lastPrice": round(last_price, 2),
            "bid": round(last_price * 0.95, 2),
            "ask": round(last_price * 1.05, 2),
            "impliedVolatility": iv,
            "openInterest": oi,
            "volume": vol,
        })

    calls_df = pd.DataFrame(rows).copy()
    puts_df = pd.DataFrame(rows).copy()

    calls_df["optionType"] = "call"
    puts_df["optionType"] = "put"

    return calls_df, puts_df, expiration, price


def get_stock_price(symbol: str) -> Optional[float]:
    """Fetch current stock price from yfinance."""
    if USE_MOCK:
        base = {"SPY": 548.32, "QQQ": 452.18}
        return base.get(symbol, 100.0)

    try:
        ticker = yf.Ticker(symbol, session=_session)
        info = ticker.info
        price = info.get("regularMarketPrice") or info.get("previousClose")
        if price is None:
            hist = ticker.history(period="1d")
            if not hist.empty:
                price = float(hist["Close"].iloc[-1])
        return float(price) if price else None
    except Exception as e:
        logger.error(f"Failed to get stock price for {symbol}: {e}")
        return None


def get_option_chain(symbol: str) -> Tuple[Optional[pd.DataFrame], Optional[pd.DataFrame], Optional[str], Optional[float]]:
    """
    Fetch option chain from yfinance.
    Returns: (calls_df, puts_df, expiration_str, stock_price)
    """
    if USE_MOCK:
        logger.info(f"Using mock data for {symbol}")
        return _generate_mock_chain(symbol)

    try:
        ticker = yf.Ticker(symbol, session=_session)
        expirations = ticker.options
        if not expirations:
            logger.warning(f"No options data for {symbol}")
            return None, None, None, None

        # Use nearest expiration (Friday)
        nearest_exp = expirations[0]
        chain = ticker.option_chain(nearest_exp)

        calls = chain.calls.copy()
        puts = chain.puts.copy()

        # Add type column
        calls["optionType"] = "call"
        puts["optionType"] = "put"

        price = get_stock_price(symbol)
        if price is None:
            price = float(calls["lastPrice"].mean()) if not calls.empty else None

        return calls, puts, nearest_exp, price
    except Exception as e:
        logger.error(f"Failed to get option chain for {symbol}: {e}")
        if USE_MOCK:
            logger.info(f"Falling back to mock data for {symbol}")
            return _generate_mock_chain(symbol)
        return None, None, None, None
