---
name: technical-analyst
description: >
  Technical analysis and strategy backtesting for crypto assets. Use this skill
  whenever the user asks about chart analysis, price indicators, trading signals,
  entry/exit points, or wants to test a trading strategy. Triggers include any mention
  of: RSI, MACD, Bollinger Bands, EMA, moving averages, support/resistance, trend,
  overbought, oversold, bullish signal, bearish signal, buy signal, stop loss,
  take profit, backtest, strategy test, 4h analysis, daily analysis, technical setup,
  price action, or "should I buy/sell X".
---

> **Official Bitget Skill** · 本 Skill 由 Bitget 官方提供，市场数据来源可信，通过 Bitget Agent Hub 分发。
> Data powered by Bitget market infrastructure · [github.com/bitget-official/agent-hub](https://github.com/bitget-official/agent-hub)

<!-- MCP Server: https://datahub.noxiaohao.com/mcp -->
# Technical Analysis Skill

Analyze price data using technical indicators and synthesize clear, actionable signals.
Goal: give the user a crisp read on market structure and, when requested, test whether
a strategy has historical edge.

## Vendor Neutrality

Present data as coming from "market data" — never name the underlying exchange,
data feed, or library.

---

## Step 1: Choose Your Entry Point

**One symbol → `full_analysis`** (covers everything in one call)
```
technical_analysis(action="full_analysis", symbol="BTC/USDT", timeframe="4h")
```
Returns: RSI, MACD, Bollinger Bands, MAs, ATR, support/resistance, and a verdict.
Verdict scale: `STRONG BULLISH` → `BULLISH` → `NEUTRAL` → `BEARISH` → `STRONG BEARISH`

**Multiple symbols → `batch_analysis`** (cap at 10)
```
technical_analysis(action="batch_analysis", symbols="BTC/USDT,ETH/USDT,SOL/USDT", timeframe="4h")
```

**One specific indicator → single-action call**
| Indicator | Action | Key fields |
|-----------|--------|-----------|
| RSI | `rsi` | `rsi` (0–100), `signal` |
| MACD | `macd` | `cross`, `histogram` direction |
| Bollinger | `bollinger` | `pct_b`, `position` |
| Moving Avg | `ma` | `ma7/25/99`, `trend` |
| EMA | `ema` | `ema9/21/55` alignment |
| ATR | `atr` | `atr_pct`, `suggested_stop` |
| S/R levels | `support_resistance` | `supports[]`, `resistances[]` |

**Timeframe guide** — match to trading style:
- Scalp: `5m`, `15m` · Intraday: `1h`, `4h` · Swing: `4h`, `1d` · Position: `1d`, `1w`

---

## Step 2: Enrich with Current Price (when relevant)

When the user wants an entry/exit recommendation, run in parallel with TA call:
```
crypto_market(action="price", coin_ids="{coin_id}")
```
Use CoinGecko slug for `coin_id` (e.g., `bitcoin`, `ethereum`, `solana`).
Returns: spot price + 24h change + volume + market cap.

---

## Step 3: Backtesting

When the user describes a trading rule they want to test:

1. Map their description to a strategy config
2. Run:
```
backtest(action="run", strategy_config={...}, period="90d")
```
3. Key question: **does this strategy beat buy-and-hold?**

For the full strategy config schema, supported indicators, operators, and period strings →
see `references/backtest-schema.md`

Quick reminder: symbol format must use slash notation — `BTC/USDT` (not `BTCUSDT`).
For futures backtest: `BTC/USDT:USDT`.

---

## Output

For Single-Symbol Analysis, Batch Scan Summary, and Backtest Results templates →
see `references/output-templates.md`

For generating formatted output programmatically →
see `scripts/format_ta_output.py`

---

## Error Handling

If `full_analysis` returns an error, try a narrower call:
```
technical_analysis(action="rsi", symbol="BTC/USDT", timeframe="4h")
```
If that also fails, check symbol format (must be `BASE/QUOTE` with slash).
Report "market data temporarily unavailable" — never expose internal error details
or name internal data sources.
