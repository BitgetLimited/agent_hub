# Output Templates — Sentiment Analyst

## Quick Snapshot

```
## Sentiment Snapshot — {SYMBOL}
*{date/time}*

**Market Mood: {EXTREME FEAR / FEAR / NEUTRAL / GREED / EXTREME GREED}**
Sentiment Index: {value}/100

Positioning: L/S ratio {value} → {Balanced / Longs crowded / Shorts crowded}
Buy pressure: Taker ratio {value} → {Aggressive buying / Neutral / Aggressive selling}

{1–2 sentences: What's the positioning risk right now?}
```

## Full Sentiment Report

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
| Open Interest trend | {rising/flat/falling} | {leverage building / neutral / unwinding} |

### Community Buzz
Top discussed assets: {coin1 #{rank}, coin2 #{rank}, coin3 #{rank}}

### Synthesis
{3–4 sentences: What does the combined picture suggest?
Are longs or shorts in a squeezable position?
Any divergence between derivatives sentiment and on-chain behavior?
Is this a good risk/reward setup or a crowded trade?}

### Risk Flags
{Only include if meaningful — e.g.:
"Funding rate above 0.1% for 3 consecutive periods — overleveraged longs"
"Exchange inflow spike — potential distribution event"
"Retail 70%+ long while price near key resistance — squeeze risk elevated"}
```

## Squeeze Risk Assessment

```
## Squeeze Risk — {SYMBOL}
*{date/time}*

### Long Squeeze Risk
- Retail L/S: {value} → {High / Medium / Low} crowding
- Funding rate: {value}% → {Overleveraged / Balanced}
- Assessment: {1 sentence}

### Short Squeeze Risk
- Short interest: {value}% → {High / Medium / Low} crowding
- Taker buy ratio: {value} → {Momentum supports / Against short squeeze}
- Assessment: {1 sentence}

### Verdict: {Long squeeze risk HIGH / Short squeeze risk HIGH / Balanced — no clear squeeze setup}
{1–2 sentences: What would trigger the squeeze and what's the likely magnitude?}
```

## Divergence Alert (when smart money and retail diverge significantly)

```
## ⚠️ Positioning Divergence Alert — {SYMBOL}
*{date/time}*

**Retail traders: {X}% {long/short}**
**Smart money: {X}% {long/short}**

This is a meaningful divergence. Historically, when retail and institutional
positioning diverge this significantly, {explanation of what typically follows}.

**Watch for**: {specific trigger — e.g., "a price rejection at {level} would likely
accelerate retail long liquidations with smart money positioned to benefit"}
```
