# Signal Interpretation Guide — Sentiment Analyst

## Fear & Greed Index

| Score | Label | Contrarian Read |
|-------|-------|----------------|
| 0–25 | Extreme Fear | Potential opportunity — market panicking |
| 26–45 | Fear | Bearish bias, be cautious chasing longs |
| 46–55 | Neutral | No crowd edge |
| 56–75 | Greed | Crowded longs possible, watch for squeeze |
| 76–100 | Extreme Greed | Historically a caution zone for new longs |

14-day trend matters as much as the current value. A rising score from 20 → 45 is more
bullish in character than a falling score from 80 → 45.

## Long/Short Ratio (Retail Accounts: `long_short`)

| Value | Interpretation | Squeeze Risk |
|-------|---------------|-------------|
| > 0.70 | Longs overwhelmingly dominant | High — short squeeze already running or done |
| 0.65–0.70 | Longs very crowded | Elevated — any reversal amplified |
| 0.45–0.65 | Balanced | Low |
| 0.35–0.45 | Shorts dominant | Short squeeze fuel building |
| < 0.35 | Shorts overwhelmingly dominant | High — potential violent short squeeze |

## Top Trader L/S (`top_ls`) vs Retail L/S (`long_short`)

Always compare these two. Divergence is the signal:

| Retail | Smart Money | Interpretation |
|--------|-------------|----------------|
| Long | Long | Consensus bullish — crowded but aligned |
| Long | Short | **Bearish divergence** — smart money hedging against retail longs |
| Short | Long | **Bullish divergence** — smart money accumulating while retail scared |
| Short | Short | Consensus bearish — crowded shorts, watch for squeeze |

## Top Trader Position Ratio (`top_position`)

Reports the percentage of top traders with net long vs net short positions.
Different from `top_ls` which uses account count. Use `top_position` for
larger whale position sizing data.

## Funding Rate

| Range | Interpretation |
|-------|---------------|
| > 0.10% | Highly overleveraged bulls — dangerous territory |
| 0.05–0.10% | Longs paying significant premium — late-stage bull leverage |
| 0.01–0.05% | Mild long bias — normal uptrend |
| ±0.01% | Balanced — neither side desperate |
| -0.01 to -0.05% | Mild short bias — bearish leverage |
| < -0.05% | Shorts paying heavily — potential squeeze |

Funding resets every 8 hours. Check time since last reset for current period context.

## Taker Buy/Sell Ratio

| Value | Interpretation |
|-------|---------------|
| > 1.2 | Strong aggressive buying — momentum behind price |
| 1.0–1.2 | Slight buy bias |
| 0.9–1.0 | Slight sell bias |
| < 0.8 | Strong aggressive selling — distribution or panic |

**Divergence signal**: Price rising + taker ratio falling = buying momentum weakening.
Price falling + taker ratio rising = selling pressure abating.

## Open Interest Trend

| OI + Price | Interpretation |
|-----------|---------------|
| OI rising + price up | New money entering long = strong trend |
| OI rising + price down | New money entering short = strong bearish momentum |
| OI rising + price flat | Leverage building without price discovery = squeeze risk |
| OI falling + price up | Short covering / deleveraging upward = less sustainable |
| OI falling + price down | Long liquidations / deleveraging downward |
| OI flat + any direction | Low conviction move |

## On-Chain Exchange Flow (Conceptual)

*Note: Direct on-chain data is not available in this server. These are interpretation
guides for when such data is available from other sources.*

| Flow Direction | Interpretation |
|---------------|---------------|
| Net outflow from exchanges | Coins moving to self-custody → accumulation signal (bullish) |
| Net inflow to exchanges | Coins moving toward selling → supply pressure (bearish) |
| Large whale transfer TO exchange | Distribution warning |
| Large whale transfer FROM exchange | Accumulation or OTC deal |
| Sudden spike in exchange inflow | Potential sell event incoming |

## Reddit Community Buzz

`derivatives_sentiment(action="reddit_trending")` returns top mentioned assets
in crypto subreddits with mention counts.

Interpretation:
- Top 3 mentions: dominant narrative assets
- Sudden spike in a lesser-known coin: retail FOMO signal
- BTC dropping in rank while alts rise: altcoin season sentiment building
- Meme coins dominating top mentions: late-cycle retail euphoria signal
