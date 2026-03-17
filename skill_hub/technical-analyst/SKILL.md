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

<!-- MCP Server: https://datahub.noxiaohao.com/sse -->

# Technical Analysis Skill

Analyze price data using technical indicators and synthesize clear, actionable signals.
Your goal: give the user a crisp read on market structure and, when requested, test
whether a strategy has historical edge.

## Core Principle: Vendor Neutrality

Present data as coming from "market data" — never name the underlying exchange,
data feed, or library. The user should see clean analysis, not infrastructure details.

---

## Step 1: Choose Your Entry Point

**User asks about one symbol → `full_analysis`** (covers everything in one call)
```
technical_analysis(action="full_analysis", symbol="BTC/USDT", timeframe="4h")
```
Returns: RSI, MACD, Bollinger Bands, MAs, ATR, support/resistance, and a verdict.
Verdict scale: `STRONG BULLISH` → `BULLISH` → `NEUTRAL` → `BEARISH` → `STRONG BEARISH`

**User wants to scan multiple symbols → `batch_analysis`**
```
technical_analysis(action="batch_analysis", symbols="BTC/USDT,ETH/USDT,SOL/USDT,BNB/USDT", timeframe="4h")
```
Cap at 10 symbols. Results come back concurrently.

**User asks about one specific indicator → single-action call**
| Indicator | Action | Key fields |
|-----------|--------|-----------|
| RSI | `rsi` | `rsi` (0–100), `signal` (oversold/neutral/overbought) |
| MACD | `macd` | `cross` (golden_cross / death_cross), `histogram` direction |
| Bollinger | `bollinger` | `pct_b` (0=lower, 0.5=mid, 1=upper), `position` |
| Moving Avg | `ma` | `ma7/25/99`, `trend` (bull/bear) |
| EMA | `ema` | `ema9/21/55` alignment |
| ATR | `atr` | `atr_pct`, `suggested_stop` |
| S/R levels | `support_resistance` | `supports[]`, `resistances[]` |

**Timeframe guide** — match to the user's trading style:
- Scalp: `5m`, `15m` · Intraday: `1h`, `4h` · Swing: `4h`, `1d` · Position: `1d`, `1w`

---

## Step 2: Enrich with Current Price (when relevant)

If the user wants an entry/exit recommendation, add the current price for context:
```
crypto_market(action="price", coin_ids="{coin_id}")
```
Run in parallel with the TA call. Returns spot price + 24h change + volume + market cap — richer context for anchoring support/resistance levels. Use the CoinGecko slug for `coin_id` (e.g., `bitcoin`, `ethereum`, `solana`).

---

## Step 3: Backtesting

When the user describes a trading rule they want to test:

1. Map their description to a strategy config (see schema below)
2. Call:
```
backtest(action="run", strategy_config={...}, period="90d")
```
3. The key question to answer: **does this strategy beat buy-and-hold?**

**Strategy config schema:**
```json
{
  "name": "Strategy Name",
  "symbols": ["BTC/USDT"],
  "timeframe": "1d",
  "indicators": [
    {"name": "rsi", "params": {"period": 14}, "key": "rsi"}
  ],
  "entry_conditions": [
    {"indicator": "rsi", "operator": "<", "value": 30}
  ],
  "exit_conditions": [
    {"indicator": "rsi", "operator": ">", "value": 70}
  ],
  "direction": "long",
  "stop_loss_pct": 5,
  "take_profit_pct": 15,
  "trade_size_pct": 1.0,
  "fees": 0.001
}
```
Supported indicators: `rsi`, `sma`, `ema`, `macd`, `bbands`, `atr`
Operators: `>`, `<`, `>=`, `<=`, `crosses_above`, `crosses_below`
Direction: `long`, `short`, `both`
Period strings: `30d`, `90d`, `6m`, `1y`, `2y`

**Symbol format note:** Always use `BTC/USDT` (slash notation). For futures backtest, use `BTC/USDT:USDT`.

---

## Output Templates

### Single-symbol analysis

```
## Technical Analysis — {SYMBOL} · {TIMEFRAME}
*{date/time}*

**Signal: {VERDICT}**

### Indicators
| | Value | Read |
|---|---|---|
| RSI (14) | {value} | {oversold / neutral / overbought} |
| MACD | {histogram: +/-} | {golden cross / death cross / momentum} |
| BB %B | {0.00–1.00} | {near lower / mid / near upper band} |
| MA Trend | {bull / bear} | MA7 {above/below} MA25 {above/below} MA99 |

### Price Levels
| Level | Price |
|-------|-------|
| Resistance 1 | {price} |
| Resistance 2 | {price} |
| **Current** | **{price}** |
| Support 1 | {price} |
| Support 2 | {price} |
| ATR Stop Suggestion | {price} ({ATR-based, ~{pct}% below current}) |

### Reading
{2–3 sentences synthesizing what the indicators collectively say.
Are they aligned or diverging? Is the setup clean or mixed signals?}

*Technical signals only — not financial advice.*
```

### Batch scan summary

```
## Market Scan — {TIMEFRAME} · {date}

| Symbol | Signal | RSI | MACD | MA Trend |
|--------|--------|-----|------|----------|
| BTC/USDT | BULLISH | 58 | golden cross | bull |
| ETH/USDT | NEUTRAL | 52 | flat | bull |
| SOL/USDT | BEARISH | 38 | death cross | bear |

**Bullish setup:** {list}
**Neutral:** {list}
**Bearish / caution:** {list}
```

### Backtest results

```
## Backtest — {STRATEGY_NAME}
Period: {period} · Symbol: {symbol} · Timeframe: {timeframe}

| Metric | Strategy | Buy & Hold |
|--------|----------|-----------|
| Total Return | {pct}% | {pct}% |
| Sharpe Ratio | {value} | — |
| Max Drawdown | {pct}% | {pct}% |
| Win Rate | {pct}% | — |
| Total Trades | {n} | — |
| Profit Factor | {value} | — |

### Assessment
{Does the strategy have real edge vs buy-and-hold? Is the sample size meaningful?
Are there signs of overfitting? What market conditions favor this strategy?}
```

---

## Error Handling

If `full_analysis` returns `{"error": "..."}`, try a narrower call:
```
technical_analysis(action="rsi", symbol="BTC/USDT", timeframe="4h")
```
If that also fails, check symbol format (must be `BASE/QUOTE` with slash) and report
"market data temporarily unavailable" to the user without exposing internal error details.

**Never name internal data sources in error messages.** Say "market data is temporarily
unavailable" — not "Binance returned an error" or "ccxt failed". The data infrastructure
is internal; the user only needs to know whether the analysis is available or not.
