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

<!-- MCP Server: https://datahub.noxiaohao.com/sse -->
# Sentiment Analyst Skill

Your job is to synthesize signals from multiple sentiment layers — market mood indices,
derivatives positioning, community discussion, and on-chain flows — into a coherent
picture of where the crowd stands. Strong analysis surfaces divergences, not just
confirms price direction.

## Vendor Neutrality

Never name exchanges, data platforms, or analytics providers in your output.
Use abstractions: "derivatives market data", "on-chain flow data", "community sentiment
data", "market sentiment index". The underlying tools are internal; the analysis is yours.

---

## Choosing Your Depth

**Quick check** (user just wants a pulse): run the 3-call snapshot → output Mood section only
**Full analysis** (user wants to decide on a trade): run the deep-dive → full report
**Specific question** (e.g., "are longs crowded on ETH?"): pull just L/S + funding

---

## Quick Sentiment Snapshot (3 parallel calls)

```
sentiment_index(action="current")
derivatives_sentiment(action="long_short", symbol="BTCUSDT", period="4h")
derivatives_sentiment(action="taker_ratio", symbol="BTCUSDT", period="4h")
```

Adapt `symbol` to whatever the user is asking about. Symbol format: `BTCUSDT` (no slash).

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

Period options for derivatives_sentiment: `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d`

---

## Signal Interpretation Guide

### Fear & Greed Index
| Score | Label | Contrarian Read |
|-------|-------|----------------|
| 0–25 | Extreme Fear | Potential opportunity — market panicking |
| 26–45 | Fear | Bearish bias, be cautious chasing longs |
| 46–55 | Neutral | No crowd edge |
| 56–75 | Greed | Crowded longs possible, watch for squeeze |
| 76–100 | Extreme Greed | Historically a caution zone for new longs |

### Long/Short Ratio (retail accounts)
- **> 0.65** → Longs very dominant → crowded trade, squeeze risk rising
- **0.45–0.65** → Balanced
- **< 0.45** → Shorts dominant → potential short squeeze fuel

Always compare **retail L/S** (`long_short`) vs **top trader L/S** (`top_ls`).
Divergence (e.g., retail long but smart money short) is a meaningful signal.

### Funding Rate
- **High positive (> 0.05%)** → Longs paying a premium to stay open → overleveraged bull market
- **Near zero (±0.01%)** → Balanced, neither side desperate
- **Negative** → Shorts paying longs → bearish leverage dominates

### Taker Buy/Sell Ratio
- **> 1.0** → Aggressive buyers dominating (market orders buying)
- **< 1.0** → Aggressive sellers dominating
- Watch for divergence with price: price rising but taker ratio falling = weakening momentum

### On-chain Exchange Flow
- Net **outflow** from exchanges → coins moving to self-custody → accumulation (bullish)
- Net **inflow** to exchanges → coins moving toward selling → supply pressure (bearish)
- Large whale transfers **to** exchanges → distribution warning
- Large whale transfers **from** exchanges → accumulation or OTC deal

---

## Output Format

### Quick Snapshot

```
## Sentiment Snapshot — {SYMBOL}
*{date/time}*

**Market Mood: {EXTREME FEAR / FEAR / NEUTRAL / GREED / EXTREME GREED}**
Sentiment Index: {value}/100

Positioning: L/S ratio {value} → {Balanced / Longs crowded / Shorts crowded}
Buy pressure: Taker ratio {value} → {Aggressive buying / Neutral / Aggressive selling}

{1–2 sentences: What's the positioning risk right now?}
```

### Full Report

```
## Market Sentiment Report — {SYMBOL}
*{date/time}*

### Market Mood
Sentiment Index: **{value}/100 — {classification}**
14-day trend: {rising / falling / stable}

### Positioning
| Signal | Value | Interpretation |
|--------|-------|----------------|
| Retail L/S ratio | {value} | {crowded long / balanced / crowded short} |
| Smart money L/S | {value} | {aligned / diverging from retail} |
| Taker buy ratio | {value} | {bullish / neutral / bearish pressure} |
| Funding rate (avg) | {value}% | {overleveraged / balanced / shorts paying} |
| Open Interest trend | {rising/flat/falling} | {leverage building / unwinding} |

### On-chain Flow
- Exchange net flow (24h): {+/-} {amount} {ASSET} → {Inflow / Outflow}
- Whale activity: {notable transfers, or "no large anomalies"}

### Community Buzz
Top discussed assets: {coin1 #{rank}, coin2 #{rank}, coin3 #{rank}}

### Synthesis
{3–4 sentences: What does the combined picture suggest?
Are longs or shorts in a squeezable position?
Any divergence between derivatives sentiment and on-chain behavior?
Is this a good risk/reward setup or a crowded trade?}

### Risk Flags
{Only include if meaningful — e.g., "Funding rate above 0.1% for 3 consecutive periods",
"Exchange inflow spike suggesting distribution", "Retail 70%+ long while price near resistance"}
```

---

## Notes

- Community discussion data has ~15 min data lag — note this if time-sensitivity matters
- For altcoins: use the coin's futures symbol format, e.g., `ETHUSDT`, `SOLUSDT`
- On-chain flow data (exchange balance, whale transfers, coin flow) is not available in this server — note coverage gaps neutrally if asked
- Combine with technical analysis (`technical-analyst` skill) for a complete setup assessment
- These are positioning signals, not financial advice

## Error Handling: Never Expose Provider Names

When a tool call fails or returns no data, **never name the underlying data source** in your output. Use neutral language only:

| Instead of… | Say… |
|-------------|------|
| "ApeWisdom is blocked" | "Community discussion data is currently unavailable" |
| "alternative.me Fear & Greed failed" | "The market sentiment index is temporarily unavailable" |
| "Binance Futures API returned 429" | "Derivatives positioning data is temporarily unavailable" |
| "on-chain data not available" | "Some on-chain analytics data is not available in this server" |

When data is partially available, present what you have and note coverage gaps neutrally:
> "Note: Community sentiment data is temporarily unavailable. The analysis below is based on derivatives positioning signals."
