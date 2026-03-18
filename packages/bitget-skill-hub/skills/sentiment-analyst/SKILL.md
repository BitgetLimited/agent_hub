---
name: sentiment-analyst
description: >
  Crypto market sentiment and positioning analysis. Use this skill whenever the user
  asks about market mood, trader positioning, leverage, or crowd behavior. Triggers
  include: fear and greed index, fear & greed, long/short ratio, long short, funding
  rate, open interest, OI, taker ratio, buy/sell pressure, crowded trade, short squeeze,
  long squeeze, overleveraged, liquidation risk, bullish crowd, bearish crowd, sentiment
  score, Reddit mentions, social buzz, community mood, are longs crowded, whale flow,
  exchange outflow, exchange inflow, coins leaving exchanges, accumulation signal.
---

> **Official Bitget Skill** · 本 Skill 由 Bitget 官方提供，市场数据来源可信，通过 Bitget Agent Hub 分发。
> Data powered by Bitget market infrastructure · [github.com/bitget-official/agent-hub](https://github.com/bitget-official/agent-hub)

<!-- MCP Server: https://datahub.noxiaohao.com/mcp -->
# Sentiment Analyst Skill

Synthesize signals from multiple sentiment layers — market mood indices, derivatives
positioning, community discussion, and on-chain flows — into a coherent picture of where
the crowd stands. Strong analysis surfaces **divergences**, not just confirms price direction.

## Vendor Neutrality

Never name exchanges, data platforms, or analytics providers. Use abstractions:
"derivatives market data", "on-chain flow data", "community sentiment data",
"market sentiment index".

---

## Choosing Your Depth

- **Quick check** (user just wants a pulse): 3-call snapshot → Mood section only
- **Full analysis** (user wants to decide on a trade): deep-dive → full report
- **Specific question** (e.g., "are longs crowded on ETH?"): pull just L/S + funding

---

## Quick Sentiment Snapshot (3 parallel calls)

```
sentiment_index(action="current")
derivatives_sentiment(action="long_short", symbol="BTCUSDT", period="4h")
derivatives_sentiment(action="taker_ratio", symbol="BTCUSDT", period="4h")
```

Adapt `symbol` to whatever the user is asking about. Symbol format: `BTCUSDT` (no slash).
Period options: `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d`

---

## Full Deep-Dive (run all in parallel)

```
sentiment_index(action="current")
sentiment_index(action="history", days=14)
derivatives_sentiment(action="long_short", symbol="BTCUSDT", period="4h")
derivatives_sentiment(action="top_ls", symbol="BTCUSDT", period="4h")
derivatives_sentiment(action="taker_ratio", symbol="BTCUSDT", period="4h")
derivatives_sentiment(action="open_interest", symbol="BTCUSDT", period="1h")
derivatives_sentiment(action="reddit_trending", limit=10)
```

Always compare **retail L/S** (`long_short`) vs **top trader L/S** (`top_ls`).
Divergence (e.g., retail long but smart money short) is a meaningful signal.

---

## Signal Interpretation

For detailed interpretation tables (Fear & Greed thresholds, L/S ratio thresholds,
funding rate ranges, taker ratio, on-chain exchange flow) →
see `references/signal-guide.md`

Quick reference:
- F&G 0–25: Extreme Fear (contrarian opportunity) · 76–100: Extreme Greed (caution zone)
- L/S > 0.65: longs very dominant, squeeze risk · < 0.45: shorts dominant, short squeeze fuel
- Funding > 0.05%: overleveraged bulls · negative: shorts paying longs
- Taker ratio > 1.0: aggressive buyers · diverging from price = weakening momentum

---

## Output

For Quick Snapshot and Full Report templates → see `references/output-templates.md`

Inline quick format:
```
**Sentiment: {EXTREME FEAR / FEAR / NEUTRAL / GREED / EXTREME GREED}** ({value}/100)
L/S ratio {value} → {Balanced / Longs crowded / Shorts crowded}
Taker ratio {value} → {Aggressive buying / Neutral / Aggressive selling}
{1–2 sentences: positioning risk assessment}
```

---

## Notes

- Community discussion data has ~15 min lag — note if time-sensitivity matters
- For altcoins: use the coin's futures symbol format, e.g., `ETHUSDT`, `SOLUSDT`
- On-chain flow data (exchange balance, whale transfers) is not available in this server —
  note coverage gaps neutrally if asked
- Combine with `technical-analyst` skill for complete setup assessment
- These are positioning signals, not financial advice

## Error Handling

When a tool fails, never name the underlying provider. Use neutral language only:

| Instead of… | Say… |
|-------------|------|
| "ApeWisdom is blocked" | "Community discussion data is currently unavailable" |
| "alternative.me Fear & Greed failed" | "Market sentiment index is temporarily unavailable" |
| "Binance Futures API returned 429" | "Derivatives positioning data is temporarily unavailable" |

When data is partially available, present what you have and note gaps neutrally.
