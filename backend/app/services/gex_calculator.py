import math
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
import pandas as pd
from scipy.stats import norm


def bs_gamma(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """
    Black-Scholes Gamma (per share).
    S: spot price
    K: strike price
    T: time to maturity (years)
    r: risk-free rate (annual)
    sigma: implied volatility (annual)
    """
    if sigma <= 0 or T <= 0 or S <= 0:
        return 0.0
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    gamma = norm.pdf(d1) / (S * sigma * math.sqrt(T))
    return gamma


def calculate_gex_profile(
    calls: pd.DataFrame,
    puts: pd.DataFrame,
    expiration: str,
    stock_price: float,
    symbol: str,
) -> Dict:
    """
    Calculate GEX profile per GEXStream methodology.
    Returns aggregated data + per-strike breakdown.
    """
    r = 0.05  # Risk-free rate assumption
    # Time to expiry in years (use 7 days if yfinance gives 0DTE or invalid)
    try:
        from datetime import datetime
        exp_dt = datetime.strptime(expiration, "%Y-%m-%d")
        days_to_exp = max((exp_dt - datetime.utcnow()).days + 1, 1)
    except Exception:
        days_to_exp = 7
    T = days_to_exp / 365.0

    # Combine calls and puts
    calls = calls.copy()
    puts = puts.copy()

    # Calculate BS gamma for each row
    def row_gamma(row):
        iv = row.get("impliedVolatility", 0)
        if pd.isna(iv) or iv <= 0:
            return 0.0
        return bs_gamma(stock_price, float(row["strike"]), T, r, float(iv))

    calls["bs_gamma"] = calls.apply(row_gamma, axis=1)
    puts["bs_gamma"] = puts.apply(row_gamma, axis=1)

    # Fill missing OI with 0
    calls["openInterest"] = calls["openInterest"].fillna(0).astype(int)
    puts["openInterest"] = puts["openInterest"].fillna(0).astype(int)

    # Calculate GEX per contract: Gamma * OI * 100
    calls["gex"] = calls["bs_gamma"] * calls["openInterest"] * 100
    puts["gex"] = puts["bs_gamma"] * puts["openInterest"] * 100

    # Merge by strike
    call_by_strike = calls.groupby("strike").agg({
        "gex": "sum",
        "openInterest": "sum",
        "bs_gamma": "sum",
        "impliedVolatility": "mean",
    }).reset_index()
    put_by_strike = puts.groupby("strike").agg({
        "gex": "sum",
        "openInterest": "sum",
        "bs_gamma": "sum",
        "impliedVolatility": "mean",
    }).reset_index()

    all_strikes = sorted(set(call_by_strike["strike"].tolist() + put_by_strike["strike"].tolist()))

    strikes_data = []
    total_call_gex = 0.0
    total_put_gex = 0.0

    for strike in all_strikes:
        call_row = call_by_strike[call_by_strike["strike"] == strike]
        put_row = put_by_strike[put_by_strike["strike"] == strike]

        call_gex = float(call_row["gex"].sum()) if not call_row.empty else 0.0
        put_gex = float(put_row["gex"].sum()) if not put_row.empty else 0.0
        net_gex = call_gex - put_gex

        call_oi = int(call_row["openInterest"].sum()) if not call_row.empty else 0
        put_oi = int(put_row["openInterest"].sum()) if not put_row.empty else 0
        total_oi = call_oi + put_oi

        call_iv = float(call_row["impliedVolatility"].mean()) if not call_row.empty else 0.0
        put_iv = float(put_row["impliedVolatility"].mean()) if not put_row.empty else 0.0
        iv = (call_iv + put_iv) / 2 if (call_iv > 0 and put_iv > 0) else max(call_iv, put_iv)

        gamma = float(call_row["bs_gamma"].sum()) if not call_row.empty else 0.0

        strikes_data.append({
            "strike": round(strike, 2),
            "callGex": round(call_gex, 4),
            "putGex": round(put_gex, 4),
            "net": round(net_gex, 4),
            "gamma": round(gamma, 6),
            "oi": total_oi,
            "iv": round(iv, 4) if not pd.isna(iv) else 0.0,
        })

        total_call_gex += call_gex
        total_put_gex += put_gex

    # Sort by strike descending
    strikes_data.sort(key=lambda x: x["strike"], reverse=True)

    # Key metrics
    net_gex_total = total_call_gex - total_put_gex
    regime = "Positive Gamma" if net_gex_total >= 0 else "Negative Gamma"

    # Call Wall: strike with max call gex
    call_wall_strike = max(strikes_data, key=lambda x: x["callGex"])["strike"] if strikes_data else 0

    # Put Wall: strike with max put gex
    put_wall_strike = max(strikes_data, key=lambda x: x["putGex"])["strike"] if strikes_data else 0

    # Gamma Flip: strike where net gex changes from positive to negative (closest to 0)
    gamma_flip_strike = min(strikes_data, key=lambda x: abs(x["net"]))["strike"] if strikes_data else 0

    # Max Pain: strike minimizing sum( OI * |price - strike| )
    def pain(s):
        call_oi_s = int(call_by_strike[call_by_strike["strike"] == s]["openInterest"].sum()) if not call_by_strike[call_by_strike["strike"] == s].empty else 0
        put_oi_s = int(put_by_strike[put_by_strike["strike"] == s]["openInterest"].sum()) if not put_by_strike[put_by_strike["strike"] == s].empty else 0
        return (call_oi_s + put_oi_s) * abs(stock_price - s)

    max_pain_strike = min(all_strikes, key=pain) if all_strikes else 0

    # GEX Ratio
    total_abs_gex = total_call_gex + total_put_gex
    gex_ratio = total_call_gex / total_abs_gex if total_abs_gex > 0 else 0.5

    return {
        "symbol": symbol,
        "expiration": expiration,
        "price": round(stock_price, 2),
        "netGex": round(net_gex_total, 4),
        "callWall": round(call_wall_strike, 2),
        "putWall": round(put_wall_strike, 2),
        "gammaFlip": round(gamma_flip_strike, 2),
        "maxPain": round(max_pain_strike, 2),
        "regime": regime,
        "gexRatio": round(gex_ratio, 4),
        "strikes": strikes_data,
        "timestamp": pd.Timestamp.utcnow().isoformat(),
    }


def calculate_market_data(symbol: str, stock_price: float, calls: pd.DataFrame, puts: pd.DataFrame) -> Dict:
    """Derive market-level metrics from option chain."""
    # ATM IV: strike closest to price
    all_strikes = pd.concat([calls[["strike", "impliedVolatility"]], puts[["strike", "impliedVolatility"]]])
    all_strikes = all_strikes.dropna(subset=["impliedVolatility"])
    all_strikes["dist"] = abs(all_strikes["strike"] - stock_price)
    if not all_strikes.empty:
        atm_idx = all_strikes["dist"].idxmin()
        iv_val = all_strikes.loc[atm_idx, "impliedVolatility"]
        # Handle potential duplicate index returning a Series
        if isinstance(iv_val, pd.Series):
            iv_val = iv_val.iloc[0]
        atm_iv = float(iv_val) * 100
    else:
        atm_iv = 0.0

    # Put/Call ratio by volume
    call_vol = calls["volume"].fillna(0).sum()
    put_vol = puts["volume"].fillna(0).sum()
    pcr = float(put_vol / call_vol) if call_vol > 0 else 0.0

    # Total OI
    total_oi = int(calls["openInterest"].fillna(0).sum() + puts["openInterest"].fillna(0).sum())

    # Change % (we don't have real change from yfinance info, use 0 for now)
    change_pct = 0.0

    # IV Rank placeholder (need historical IV data, not available in single snapshot)
    iv_rank = 50

    return {
        "symbol": symbol,
        "price": round(stock_price, 2),
        "changePct": round(change_pct, 2),
        "atmIv": round(atm_iv, 2),
        "ivRank": iv_rank,
        "pcr": round(pcr, 2),
        "volume": int(total_oi),
        "timestamp": pd.Timestamp.utcnow().isoformat(),
    }
