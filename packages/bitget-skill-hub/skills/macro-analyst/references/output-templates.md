# Output Templates — Macro Analyst

## Full Macro Report

```
## Macro Intelligence Report
*{date}*

### Rate Environment
| Rate | Value | Signal |
|------|-------|--------|
| Fed Funds | {rate}% | {hawkish / neutral / dovish} |
| 10Y Treasury | {rate}% | — |
| 2Y Treasury | {rate}% | — |
| 10Y–2Y Spread | {spread}% | {Normal / ⚠️ Inverted} |
| 10Y Breakeven | {rate}% | Inflation expectation |

### Economic Health
| Indicator | Latest | Trend |
|-----------|--------|-------|
| CPI (YoY) | {value}% | {↑/↓/→} |
| Core PCE | {value}% | {↑/↓/→} |
| Unemployment | {value}% | {↑/↓/→} |
| NFP | {+/-}{k} jobs | — |

### Cross-Asset Correlation (30-day rolling)
| Asset | Corr to BTC | Trend | What it means |
|-------|------------|-------|---------------|
| Gold | {value} | {↑/↓} | {interpretation} |
| DXY | {value} | {↑/↓} | {interpretation} |
| Nasdaq | {value} | {↑/↓} | {interpretation} |
| 10Y Yield | {value} | {↑/↓} | {interpretation} |
| VIX | {value} | {↑/↓} | {interpretation} |

### Macro Verdict: {RISK-ON 🟢 / MIXED 🟡 / RISK-OFF 🔴}

{3–5 sentences: What is the rate/inflation picture signaling for policy direction?
How is BTC's correlation to risk/safe-haven assets behaving right now?
What macro catalysts (FOMC, data releases, geopolitical events) are most relevant?}

### Watch List
- {Most important upcoming catalyst — e.g., next FOMC date, key data release}
- {Second catalyst}
```

## Yield Curve Focus

```
## Yield Curve & Rate Environment
*{date}*

| Maturity | Yield | vs Fed Funds |
|----------|-------|-------------|
| 3-Month | {rate}% | — |
| 2-Year | {rate}% | — |
| 10-Year | {rate}% | — |
| 30-Year | {rate}% | — |
| 10Y–2Y Spread | **{spread}%** | {Normal / ⚠️ Inverted since {date}} |

**Recession signal:** {No inversion / Curve inverted — historically precedes recession by 12–24 months}

{2–3 sentences: What is the current yield curve shape saying about growth and policy expectations?
How does this translate into a macro risk assessment for crypto?}
```

## Inflation Focus

```
## Inflation & Labor Market Report
*{date}*

### Inflation Readings
| Measure | Latest | Prior | Fed Target | Trend |
|---------|--------|-------|-----------|-------|
| CPI (YoY) | {value}% | {value}% | ~2% | {↑/↓/→} |
| Core CPI | {value}% | {value}% | — | {↑/↓/→} |
| Core PCE | {value}% | {value}% | 2% | {↑/↓/→} |
| PPI (YoY) | {value}% | {value}% | — | {↑/↓/→} |

### Labor Market
| Indicator | Latest | Signal |
|-----------|--------|--------|
| Unemployment | {value}% | {Tight / Softening / Weak} |
| NFP | {+/-}{k} | {Strong / Moderate / Weak} |

### Fed Implication
{2–3 sentences: What does current inflation relative to the 2% target imply for Fed policy?
Is the next move more likely a cut or a hold? How does this affect the risk backdrop for BTC?}

### FOMC Context
{Latest Fed communication headline or "no recent FOMC statement available"}
```

## Cross-Asset Correlation Focus

```
## Cross-Asset Correlation Analysis — BTC
*{date} · Rolling {window}-day window · {period} lookback*

| Asset | Full Period Corr | 30-day Corr | Trend | Interpretation |
|-------|-----------------|-------------|-------|----------------|
| Gold | {value} | {value} | {↑/↓} | {safe haven / risk asset} |
| DXY | {value} | {value} | {↑/↓} | {inverse / decoupled} |
| Nasdaq 100 | {value} | {value} | {↑/↓} | {tech risk proxy} |
| S&P 500 | {value} | {value} | {↑/↓} | {broad risk proxy} |
| 10Y Yield | {value} | {value} | {↑/↓} | {rates sensitivity} |
| VIX | {value} | {value} | {↑/↓} | {fear correlation} |

### Key Observation
{2–3 sentences: What is the dominant cross-asset relationship right now?
Is BTC trading more like a risk asset (correlated to Nasdaq) or a store of value
(correlated to Gold, inversely to DXY)? Any meaningful changes in recent weeks?}
```
