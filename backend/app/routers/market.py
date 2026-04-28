from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session

from app.database import get_session
from app.services.yahoo_service import get_option_chain
from app.services.gex_calculator import calculate_market_data
from app.services.storage_service import (
    get_latest_market_quote,
    store_market_quote,
)
from app.config import get_settings

router = APIRouter(prefix="/market", tags=["Market"])
settings = get_settings()


def verify_api_key(x_api_key: Optional[str] = Header(None)) -> None:
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@router.get("/{symbol}")
def read_market(
    symbol: str,
    session: Session = Depends(get_session),
    _: None = Depends(verify_api_key),
):
    """Get latest market data for a symbol."""
    cached = get_latest_market_quote(session, symbol.upper())
    if cached:
        return cached

    calls, puts, _, price = get_option_chain(symbol.upper())
    if calls is None or puts is None or price is None:
        raise HTTPException(status_code=404, detail=f"No market data for {symbol}")

    data = calculate_market_data(symbol.upper(), price, calls, puts)
    store_market_quote(session, data)
    return data
