from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import Field, SQLModel


class GexSnapshot(SQLModel, table=True):
    """Per-strike GEX snapshot from yfinance calculation."""

    __tablename__ = "gex_snapshots"

    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True)
    expiration: str = Field(index=True)
    strike: Decimal = Field(decimal_places=2, max_digits=10)
    call_gex: Decimal = Field(decimal_places=4, max_digits=15)
    put_gex: Decimal = Field(decimal_places=4, max_digits=15)
    net_gex: Decimal = Field(decimal_places=4, max_digits=15)
    gamma: Decimal = Field(decimal_places=6, max_digits=15)
    oi: int
    iv: Decimal = Field(decimal_places=4, max_digits=10)
    snapshot_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class GexProfile(SQLModel, table=True):
    """Aggregated GEX profile per symbol+expiration snapshot."""

    __tablename__ = "gex_profiles"

    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True)
    expiration: str = Field(index=True)
    net_gex: Decimal = Field(decimal_places=4, max_digits=15)
    call_wall: Decimal = Field(decimal_places=2, max_digits=10)
    put_wall: Decimal = Field(decimal_places=2, max_digits=10)
    gamma_flip: Decimal = Field(decimal_places=2, max_digits=10)
    max_pain: Decimal = Field(decimal_places=2, max_digits=10)
    regime: str  # "Positive Gamma" or "Negative Gamma"
    computed_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class MarketQuote(SQLModel, table=True):
    """Latest market quote for a symbol."""

    __tablename__ = "market_quotes"

    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True)
    price: Decimal = Field(decimal_places=2, max_digits=10)
    change_pct: Decimal = Field(decimal_places=2, max_digits=6)
    atm_iv: Decimal = Field(decimal_places=2, max_digits=6)
    iv_rank: int
    pcr: Decimal = Field(decimal_places=2, max_digits=5)
    volume: int
    quoted_at: datetime = Field(default_factory=datetime.utcnow, index=True)
