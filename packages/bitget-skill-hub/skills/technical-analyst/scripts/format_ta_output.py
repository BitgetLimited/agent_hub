#!/usr/bin/env python3
"""
format_ta_output.py — Technical Analysis output formatter

Converts raw technical_analysis tool response into clean markdown tables.
Use this when you need to format TA results consistently across multiple symbols
or when the raw output needs post-processing before presentation.

Usage:
    python format_ta_output.py --input <json_file_or_stdin>
    python format_ta_output.py --symbol BTC/USDT --timeframe 4h

Input: JSON from technical_analysis(action="full_analysis") or batch_analysis
Output: Markdown formatted report (stdout)
"""

import json
import sys
import argparse
from datetime import datetime, timezone


VERDICT_EMOJI = {
    "STRONG BULLISH": "🟢🟢",
    "BULLISH": "🟢",
    "NEUTRAL": "🟡",
    "BEARISH": "🔴",
    "STRONG BEARISH": "🔴🔴",
}

RSI_LABEL = lambda v: "🔵 Oversold" if v < 30 else ("🔴 Overbought" if v > 70 else "— Neutral")
BB_LABEL = lambda v: "Lower band" if v < 0.2 else ("Upper band" if v > 0.8 else "Mid range")


def format_single(data: dict, symbol: str = "", timeframe: str = "") -> str:
    """Format a full_analysis result into markdown."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sym = symbol or data.get("symbol", "UNKNOWN")
    tf = timeframe or data.get("timeframe", "")
    verdict = data.get("verdict", "NEUTRAL")
    emoji = VERDICT_EMOJI.get(verdict, "")

    # Indicators
    rsi_val = data.get("rsi", {}).get("rsi", 0)
    rsi_label = RSI_LABEL(rsi_val)

    macd = data.get("macd", {})
    macd_cross = macd.get("cross", "—")
    macd_hist = macd.get("histogram", 0)
    macd_label = f"{'▲' if macd_hist > 0 else '▼'} {macd_cross}"

    bb = data.get("bollinger", {})
    pct_b = bb.get("pct_b", 0.5)
    bb_label = BB_LABEL(pct_b)

    ma = data.get("ma", {})
    ma_trend = ma.get("trend", "—")

    # Support/Resistance
    sr = data.get("support_resistance", {})
    supports = sr.get("supports", [])
    resistances = sr.get("resistances", [])
    current_price = data.get("current_price") or data.get("price", "—")

    # ATR
    atr = data.get("atr", {})
    atr_stop = atr.get("suggested_stop", "—")
    atr_pct = atr.get("atr_pct", "—")

    lines = [
        f"## Technical Analysis — {sym} · {tf}",
        f"*{now}*",
        f"",
        f"**Signal: {verdict} {emoji}**",
        f"",
        f"### Indicators",
        f"| | Value | Read |",
        f"|---|---|---|",
        f"| RSI (14) | {rsi_val:.1f} | {rsi_label} |",
        f"| MACD | hist {macd_hist:+.4f} | {macd_label} |",
        f"| BB %B | {pct_b:.2f} | {bb_label} |",
        f"| MA Trend | {ma_trend} | MA7/25/99 alignment |",
        f"",
        f"### Price Levels",
        f"| Level | Price |",
        f"|-------|-------|",
    ]

    for r in reversed(resistances[-2:]):
        lines.append(f"| Resistance | {r} |")

    lines.append(f"| **Current** | **{current_price}** |")

    for s in supports[:2]:
        lines.append(f"| Support | {s} |")

    if atr_stop != "—":
        lines.append(f"| ATR Stop | {atr_stop} (~{atr_pct}% below current) |")

    lines += [
        f"",
        f"*Technical signals only — not financial advice.*",
    ]

    return "\n".join(lines)


def format_batch(data: list, timeframe: str = "") -> str:
    """Format batch_analysis results into a scan summary table."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    tf = timeframe or "—"

    lines = [
        f"## Market Scan — {tf} · {now}",
        f"",
        f"| Symbol | Signal | RSI | MACD | MA Trend |",
        f"|--------|--------|-----|------|----------|",
    ]

    bullish, neutral, bearish = [], [], []

    for item in data:
        sym = item.get("symbol", "—")
        verdict = item.get("verdict", "NEUTRAL")
        rsi = item.get("rsi", {}).get("rsi", "—")
        rsi_str = f"{rsi:.0f}" if isinstance(rsi, float) else str(rsi)
        macd_cross = item.get("macd", {}).get("cross", "—")
        ma_trend = item.get("ma", {}).get("trend", "—")
        emoji = VERDICT_EMOJI.get(verdict, "")

        lines.append(f"| {sym} | {verdict} {emoji} | {rsi_str} | {macd_cross} | {ma_trend} |")

        if "BULLISH" in verdict:
            bullish.append(sym)
        elif "BEARISH" in verdict:
            bearish.append(sym)
        else:
            neutral.append(sym)

    lines += [
        f"",
        f"**Bullish setups:** {', '.join(bullish) if bullish else 'None'}",
        f"**Neutral / mixed:** {', '.join(neutral) if neutral else 'None'}",
        f"**Bearish / caution:** {', '.join(bearish) if bearish else 'None'}",
    ]

    return "\n".join(lines)


def format_backtest(data: dict) -> str:
    """Format backtest result into comparison table."""
    name = data.get("strategy_name", "Strategy")
    period = data.get("period", "—")
    symbol = data.get("symbol", "—")
    tf = data.get("timeframe", "—")

    strat = data.get("strategy", {})
    bah = data.get("buy_and_hold", {})

    total_trades = strat.get("total_trades", 0)
    low_sample = total_trades < 15

    lines = [
        f"## Backtest — {name}",
        f"Period: {period} · Symbol: {symbol} · Timeframe: {tf}",
        f"",
        f"| Metric | Strategy | Buy & Hold |",
        f"|--------|----------|-----------|",
        f"| Total Return | {strat.get('total_return_pct', '—')}% | {bah.get('total_return_pct', '—')}% |",
        f"| Sharpe Ratio | {strat.get('sharpe_ratio', '—')} | — |",
        f"| Max Drawdown | {strat.get('max_drawdown_pct', '—')}% | {bah.get('max_drawdown_pct', '—')}% |",
        f"| Win Rate | {strat.get('win_rate_pct', '—')}% | — |",
        f"| Total Trades | {total_trades} | — |",
        f"| Profit Factor | {strat.get('profit_factor', '—')} | — |",
    ]

    if low_sample:
        lines += [
            f"",
            f"⚠️ Only {total_trades} trades in this period — results may not be statistically significant.",
        ]

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Format TA output to markdown")
    parser.add_argument("--input", help="JSON input file (default: stdin)")
    parser.add_argument("--type", choices=["single", "batch", "backtest", "auto"],
                        default="auto", help="Output type")
    args = parser.parse_args()

    if args.input:
        with open(args.input) as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)

    output_type = args.type
    if output_type == "auto":
        if isinstance(data, list):
            output_type = "batch"
        elif "strategy_name" in data or "buy_and_hold" in data:
            output_type = "backtest"
        else:
            output_type = "single"

    if output_type == "single":
        print(format_single(data))
    elif output_type == "batch":
        print(format_batch(data))
    elif output_type == "backtest":
        print(format_backtest(data))


if __name__ == "__main__":
    main()
