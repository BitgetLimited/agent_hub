# Output Templates — Technical Analyst

## Single-Symbol Analysis

```
## Technical Analysis — {SYMBOL} · {TIMEFRAME}
*{date/time}*

**Signal: {STRONG BULLISH / BULLISH / NEUTRAL / BEARISH / STRONG BEARISH}**

### Indicators
| | Value | Read |
|---|---|---|
| RSI (14) | {value} | {oversold <30 / neutral / overbought >70} |
| MACD | histogram {+/-} | {golden cross / death cross / neutral momentum} |
| BB %B | {0.00–1.00} | {near lower band / mid / near upper band} |
| MA Trend | {bull / bear} | MA7 {above/below} MA25 {above/below} MA99 |

### Price Levels
| Level | Price |
|-------|-------|
| Resistance 2 | {price} |
| Resistance 1 | {price} |
| **Current** | **{price}** |
| Support 1 | {price} |
| Support 2 | {price} |
| ATR Stop Suggestion | {price} (~{pct}% below current) |

### Reading
{2–3 sentences synthesizing what the indicators collectively say.
Are they aligned or diverging? Is the setup clean or mixed signals?
Where is the highest conviction entry/exit if any?}

*Technical signals only — not financial advice.*
```

## Batch Scan Summary

```
## Market Scan — {TIMEFRAME} · {date}

| Symbol | Signal | RSI | MACD | MA Trend | Key Level |
|--------|--------|-----|------|----------|-----------|
| BTC/USDT | BULLISH | 58 | golden cross | bull | Support: $X |
| ETH/USDT | NEUTRAL | 52 | flat | bull | — |
| SOL/USDT | BEARISH | 38 | death cross | bear | Resistance: $X |

**Strongest setups:** {symbols with clear directional signal}
**Neutral / mixed:** {symbols with conflicting indicators}
**Caution / avoid:** {symbols showing bearish confluence}

### Scan Takeaway
{1–2 sentences: Is there a market-wide trend or are setups diverging? Any sector rotation?}
```

## Backtest Results

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
{Does the strategy have real edge vs buy-and-hold?
Is the sample size meaningful (≥15 trades)?
Are there signs of overfitting (very high win rate + few trades)?
What market conditions (trending vs ranging) favor this strategy?
Would this strategy work in different market regimes?}

{If total_trades < 15: "⚠️ Only {n} trades in this period — results may not be
statistically significant. Consider extending the backtest period."}
```

## Indicator Deep-Dive

```
## {INDICATOR} Analysis — {SYMBOL} · {TIMEFRAME}
*{date/time}*

**{Indicator name}:** {value}
**Signal:** {interpretation}

{2–3 sentences: Why does this reading matter in the current context?
What price action would confirm or invalidate this signal?}

**Next level to watch:** {specific price or indicator level that changes the picture}
```
