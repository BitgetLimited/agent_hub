# Output Templates — Market Intelligence

## Institutional Flow Report

```
## Institutional Flow Intelligence — {ASSET}
*{date}*

### News Signal
{Top 2–3 institutional/ETF-related headlines with market implication}
1. **{Headline}** — {1 sentence on market implication}
2. **{Headline}** — {1 sentence}

### Derivatives Smart Money Positioning
- Top trader L/S ratio: {value} → {Net long / Net short / Balanced}
- Top trader position ratio: {value} → {size-weighted bullish / bearish}
- Open interest trend: {rising/flat/falling} → {leverage building / neutral / unwinding}

### Signal
{1–2 sentences: What is smart money positioning suggesting?}

*Note: Direct ETF flow figures are not available in this data source.
For exact daily ETF inflow/outflow data, refer to financial news sources.*
```

## Market Cycle Assessment

```
## Market Cycle Assessment — BTC
*{date}*

### Price Context (1-year range)
- Current: ${price}
- 1Y High: ${high} | 1Y Low: ${low}
- Position in range: {bottom 25% / mid-range / top 25%} — informal cycle proxy

### Market Structure
| Signal | Value | Interpretation |
|--------|-------|----------------|
| BTC Dominance | {value}% | {Early cycle / Mid cycle / Late cycle} |
| Total Market Cap | ${value}T | {trend} |
| Stablecoin Supply | ${value}B | {Dry powder building / Deployed / Shrinking} |

### Altcoin Breadth
{Breadth check — how many of top 50 coins are above their 30-day MA?
Or qualitative assessment of altcoin performance vs BTC}

### Cycle Assessment
{2–3 sentences: Based on price range position, BTC dominance, and stablecoin dry powder,
where does this informally fit in the market cycle?}

*Note: Precise on-chain cycle indicators (AHR999, Pi Cycle, Rainbow Chart) require
on-chain data not available in this data source.*
```

## Network Health Report

```
## Network Health — {ASSET(S)}
*{date/time}*

### Ethereum
- Gas (slow): {gwei} gwei | Standard: {gwei} | Fast: {gwei} | Instant: {gwei}
- Activity level: {Low / Normal / High / Congested}

### Bitcoin
- Recommended fees: Fast {sat/vB} | HalfHour {sat/vB} | Hour {sat/vB}
- Mempool: {count} pending transactions | Total fees: {BTC}
- Activity level: {Low / Normal / High / Congested}

### Assessment
{1 sentence: What does current network activity suggest about on-chain demand?}
```

## DEX Intelligence Report

```
## DEX Trending Tokens
*{date/time}*

⚠️ *Note: DEX trending lists may include paid token promotions. Always DYOR.*

| Rank | Token | Chain | Price | 24h Volume | 24h Change |
|------|-------|-------|-------|------------|------------|
| 1 | {symbol} | {chain} | ${price} | ${volume} | {pct}% |
| 2 | ... |

### Notable Observations
{1–2 sentences: Any genuine trending tokens backed by volume? Any obvious promotion vs organic?}
```

## Full Market Intelligence Brief

```
## Market Intelligence Brief
*{date}*

### Institutional Activity
{1–3 bullet points from ETF/institutional news + derivatives smart money}

### On-chain Structure
{Stablecoin dry powder status + DeFi TVL trend in 1–2 sentences}

### Cycle Position
BTC dominance {value}% → {cycle interpretation}
Market cap position: {bottom/mid/top} of 1-year range

### Network Activity
ETH gas: {gwei} (standard) | BTC fees: {sat/vB} (fast)
Activity: {Low / Normal / High}

### Key Signal
{1–2 sentences: What is the most important structural observation right now?
What should a medium-term investor pay attention to?}
```
