from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session

from app.database import get_session
from app.services.yahoo_service import get_option_chain
from app.services.gex_calculator import calculate_gex_profile
from app.services.storage_service import (
    get_gex_history,
    get_latest_gex_profile,
    store_gex_snapshot,
)
from app.config import get_settings

router = APIRouter(prefix="/gex", tags=["GEX"])
settings = get_settings()


def verify_api_key(x_api_key: Optional[str] = Header(None)) -> None:
    """Simple API key verification."""
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@router.get("/{symbol}")
def read_gex(
    symbol: str,
    session: Session = Depends(get_session),
    _: None = Depends(verify_api_key),
):
    """Get latest GEX profile for a symbol."""
    # Try cache first
    cached = get_latest_gex_profile(session, symbol.upper())
    if cached:
        return cached

    # Fallback: fetch and compute now
    calls, puts, expiration, price = get_option_chain(symbol.upper())
    if calls is None or puts is None or price is None:
        raise HTTPException(status_code=404, detail=f"No options data for {symbol}")

    profile = calculate_gex_profile(calls, puts, expiration, price, symbol.upper())
    store_gex_snapshot(session, profile)
    return profile


@router.get("/{symbol}/history")
def read_gex_history(
    symbol: str,
    days: int = 5,
    session: Session = Depends(get_session),
    _: None = Depends(verify_api_key),
):
    """Get GEX history for trend chart."""
    history = get_gex_history(session, symbol.upper(), days)
    return {"symbol": symbol.upper(), "history": history}
