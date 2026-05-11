import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import desc, select
from sqlmodel import Session

from app.models import GexProfile, GexSnapshot, MarketQuote

logger = logging.getLogger(__name__)


def store_gex_snapshot(session: Session, profile: Dict) -> None:
    """Store per-strike GEX snapshots and aggregated profile."""
    symbol = profile["symbol"]
    expiration = profile["expiration"]
    now = datetime.utcnow()

    # Insert snapshots
    for s in profile.get("strikes", []):
        snap = GexSnapshot(
            symbol=symbol,
            expiration=expiration,
            strike=s["strike"],
            call_gex=s["callGex"],
            put_gex=s["putGex"],
            net_gex=s["net"],
            gamma=s["gamma"],
            oi=s["oi"],
            iv=s["iv"],
            snapshot_at=now,
        )
        session.add(snap)

    # Insert profile
    prof = GexProfile(
        symbol=symbol,
        expiration=expiration,
        net_gex=profile["netGex"],
        call_wall=profile["callWall"],
        put_wall=profile["putWall"],
        gamma_flip=profile["gammaFlip"],
        max_pain=profile["maxPain"],
        regime=profile["regime"],
        computed_at=now,
    )
    session.add(prof)
    session.commit()


def store_market_quote(session: Session, data: Dict) -> None:
    """Store latest market quote."""
    quote = MarketQuote(
        symbol=data["symbol"],
        price=data["price"],
        change_pct=data["changePct"],
        atm_iv=data["atmIv"],
        iv_rank=data["ivRank"],
        pcr=data["pcr"],
        volume=data["volume"],
        quoted_at=datetime.utcnow(),
    )
    session.add(quote)
    session.commit()


def get_latest_gex_profile(session: Session, symbol: str) -> Optional[Dict]:
    """Get the most recent GEX profile for a symbol."""
    stmt = (
        select(GexProfile)
        .where(GexProfile.symbol == symbol)
        .order_by(desc(GexProfile.computed_at))
        .limit(1)
    )
    result = session.execute(stmt).scalars().first()
    if not result:
        return None

    # Also fetch strike-level snapshots from same time window (within last 1 min)
    time_cutoff = result.computed_at - timedelta(minutes=1)
    snap_stmt = (
        select(GexSnapshot)
        .where(
            GexSnapshot.symbol == symbol,
            GexSnapshot.expiration == result.expiration,
            GexSnapshot.snapshot_at >= time_cutoff,
        )
        .order_by(desc(GexSnapshot.strike))
    )
    snaps = session.execute(snap_stmt).scalars().all()

    return {
        "symbol": result.symbol,
        "expiration": result.expiration,
        "netGex": float(result.net_gex),
        "callWall": float(result.call_wall),
        "putWall": float(result.put_wall),
        "gammaFlip": float(result.gamma_flip),
        "maxPain": float(result.max_pain),
        "regime": result.regime,
        "strikes": [
            {
                "strike": float(s.strike),
                "callGex": float(s.call_gex),
                "putGex": float(s.put_gex),
                "net": float(s.net_gex),
                "gamma": float(s.gamma),
                "oi": s.oi,
                "iv": float(s.iv),
            }
            for s in snaps
        ],
        "timestamp": result.computed_at.isoformat(),
    }


def get_latest_market_quote(session: Session, symbol: str) -> Optional[Dict]:
    """Get the most recent market quote for a symbol."""
    stmt = (
        select(MarketQuote)
        .where(MarketQuote.symbol == symbol)
        .order_by(desc(MarketQuote.quoted_at))
        .limit(1)
    )
    result = session.execute(stmt).scalars().first()
    if not result:
        return None
    return {
        "symbol": result.symbol,
        "price": float(result.price),
        "changePct": float(result.change_pct),
        "atmIv": float(result.atm_iv),
        "ivRank": result.iv_rank,
        "pcr": float(result.pcr),
        "volume": result.volume,
        "timestamp": result.quoted_at.isoformat(),
    }


def get_gex_history(session: Session, symbol: str, days: int = 5) -> List[Dict]:
    """Get daily GEX profile history for trend chart."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    stmt = (
        select(GexProfile)
        .where(GexProfile.symbol == symbol, GexProfile.computed_at >= cutoff)
        .order_by(GexProfile.computed_at)
    )
    results = session.execute(stmt).scalars().all()
    return [
        {"date": r.computed_at.strftime("%m/%d"), "netGex": float(r.net_gex)}
        for r in results
    ]
