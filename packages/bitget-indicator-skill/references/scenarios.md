# Scenario Indicator Selection Guide

9 analysis scenarios organized by the **dimensional differentiation principle**.

Each scenario's default indicators provide a **unique, non-replaceable information dimension** — no stacking of same-dimension indicators.

---

## Case 1: Custom Query

**Triggers**: "analyze BTC with RSI(21) + EMA(50) + ATR", "calculate MACD and KDJ"

**AI behavior**: Detect that the user specified exact indicators/parameters. Follow the user's request fully — do not apply any scenario template.

**Config example**:

```python
config = {
    "RSI": {"period": 21},
    "EMA": {"period": 50},
    "ATR": {"period": 14},
}
```

**Note**: Same indicator with different periods (e.g. EMA 50 + EMA 200) requires separate calculations.

**Output template**:

```markdown
## {SYMBOL} Custom Indicator Analysis ({GRANULARITY})

| Indicator | Recent Trend (last {TAIL} bars) | Current |
|-----------|--------------------------------|---------|
| RSI (21) | {rising/falling} from {start} to {end} | {val} |
| EMA (50) | {rising/flat/falling} | ${val} |
| ATR (14) | {expanding/contracting} | ${val} |

Note: The above is objective data for user-selected indicators and does not constitute trading advice.
```

---

## Case 2: Comprehensive Technical Analysis

**Triggers**: "BTC technical analysis", "how's ETH looking technically"

**Default indicators** (6 indicators, 6 dimensions):

```python
config = {
    "MACD": {"fast": 12, "slow": 26, "signal": 9},  # momentum
    "RSI": {"period": 14},                            # overbought/oversold
    "KDJ": {"period": 9},                             # extreme signals
    "BOLL": {"period": 20, "std_dev": 2},             # volatility
    "SuperTrend": {"period": 10, "multiplier": 3.0},  # trend
    "VOL": {"period": 20},                            # volume
}
```

**Output template**:

```markdown
## {SYMBOL} Technical Analysis ({GRANULARITY})

**Overall: {conclusion}**

| Dimension | Indicator | Recent Trend (last {TAIL} bars) | Current |
|-----------|-----------|--------------------------------|---------|
| Trend | SuperTrend | direction held for {N} bars | {bullish/bearish} |
| Momentum | MACD | HIST {narrowing/widening}, DIF/DEA {converging/diverging} | DIF={val} |
| Overbought/Oversold | RSI (14) | {rising/falling} from {start} to {end} | {val} |
| Extreme Signal | KDJ (J) | {description of J movement} | {val} |
| Volatility | BOLL | bandwidth {expanding/contracting} | price at {position} |
| Volume | VOL | {description} | {ratio}x avg |

The above is objective technical indicator data and does not constitute trading advice.
```

---

## Case 3: Trend Direction

**Triggers**: "bullish or bearish", "trend direction", "what's BTC's current trend"

**Default indicators** (5 indicators, 5 dimensions):

```python
config = {
    "SuperTrend": {"period": 10, "multiplier": 3.0},  # ATR-adaptive trend
    "MACD": {"fast": 12, "slow": 26, "signal": 9},    # EMA crossover momentum
    "DMI": {"n1": 14, "n2": 14},                       # trend strength
    "SAR": {"af_start": 0.02, "af_max": 0.2},         # reversal detection
    "EMA": {"period": 20},                             # moving average position
}
```

**Output template**:

```markdown
## {SYMBOL} Trend Analysis ({GRANULARITY})

**Direction: {bullish/bearish}** ({N}/5 indicators agree) | Trend strength: {ADX description}

| Indicator | Method | Recent Behavior | Current Direction |
|-----------|--------|----------------|-------------------|
| SuperTrend | ATR-adaptive | direction held for {N} bars | {direction} |
| MACD | EMA crossover | HIST {narrowing/widening} | DIF {>/<} DEA |
| DMI | Trend strength | ADX {rising/falling} | ADX={val}, DI+ vs DI- |
| SAR | Reversal detection | SAR {stable/flipping} | SAR {above/below} price |
| EMA (20) | MA position | {rising/flat/falling} | price {>/<} EMA |
```

---

## Case 4: Overbought / Oversold

**Triggers**: "is it overbought", "what's RSI at", "oversold"

**Default indicators** (4 indicators, 4 dimensions):

```python
config = {
    "RSI": {"period": 14},                            # standard gauge
    "StochRSI": {"n": 120, "m": 20},                  # sensitive early warning
    "MFI": {"period": 14},                             # volume-weighted confirmation
    "SuperTrend": {"period": 10, "multiplier": 3.0},   # trend filter
}
```

**Dimensional differentiation**: RSI (standard baseline) + StochRSI (2-3 bar early warning) + MFI (only OB/OS indicator incorporating volume) + SuperTrend (trend filter — overbought in a strong uptrend doesn't necessarily mean reversal)

**Output template**:

```markdown
## {SYMBOL} Overbought/Oversold Analysis ({GRANULARITY})

**Overall: {conclusion}** ({trend context})

| Role | Indicator | Recent Trend (last {TAIL} bars) | Current |
|------|-----------|--------------------------------|---------|
| Standard gauge | RSI (14) | {rising/falling} from {start} to {end} | {val} |
| Early warning | StochRSI | {rising/falling} from {start} to {end} | {val} |
| Volume confirmation | MFI (14) | {description} | {val} |
| Trend filter | SuperTrend | direction held for {N} bars | {direction} |

{Synthesis: e.g. "RSI and StochRSI approaching oversold while MFI already in oversold territory with volume confirmation"}
```

---

## Case 5: Volume Analysis

**Triggers**: "how's the volume", "volume", "high or low volume"

**Default indicators** (3 indicators, 3 dimensions):

```python
config = {
    "VOL": {"period": 20},                            # volume magnitude
    "OBV": {"fast_period": 10, "slow_period": 30},    # money flow direction
    "VWAP": {"period": 20},                            # price benchmark
}
```

**Output template**:

```markdown
## {SYMBOL} Volume Analysis ({GRANULARITY})

**Overall: {conclusion}**

| Dimension | Indicator | Recent Trend (last {TAIL} bars) | Current |
|-----------|-----------|--------------------------------|---------|
| Magnitude | VOL | {description of volume changes} | {ratio}x avg |
| Money flow | OBV | histogram {rising/falling} | {inflow/outflow} |
| Price benchmark | VWAP | price {crossing above/below / staying above/below} | ${val} |
```

---

## Case 6: Momentum Strength

**Triggers**: "is momentum increasing", "momentum", "is the trend accelerating or decelerating"

**Default indicators** (3 indicators, 3 dimensions):

```python
config = {
    "MACD": {"fast": 12, "slow": 26, "signal": 9},  # smoothed momentum
    "ROC": {"period": 20},                            # raw rate of change
    "EMV": {"period": 14},                            # volume-adjusted momentum
}
```

**Output template**:

```markdown
## {SYMBOL} Momentum Analysis ({GRANULARITY})

**Overall: {conclusion}**

| Dimension | Indicator | Recent Trend (last {TAIL} bars) | Current |
|-----------|-----------|--------------------------------|---------|
| Smoothed momentum | MACD | HIST {narrowing/widening from X to Y} | HIST={val} |
| Rate of change | ROC (20) | {accelerating/decelerating} | {val}% |
| Volume-adjusted | EMV | {description} | {val} |
```

---

## Case 7: Support / Resistance

**Triggers**: "where is support", "resistance level", "key price levels"

**Default indicators** (5 indicators, 5 dimensions):

```python
config = {
    "FIB": {"n": 100, "m": 5},                         # mathematical ratios
    "BOLL": {"period": 20, "std_dev": 2},               # statistical bands
    "SuperTrend": {"period": 10, "multiplier": 3.0},    # dynamic trend line
    "VWAP": {"period": 20},                              # volume-weighted benchmark
    "MA": {"period": 60},                                # long-period moving average
}
```

**Output template**:

```markdown
## {SYMBOL} Support/Resistance Analysis ({GRANULARITY})

**Strong support zone: ${lower} - ${upper}** (multi-source overlap)

| Source | Method | Resistance | Support |
|--------|--------|------------|---------|
| BOLL | Statistical bands | Upper ${val} | Lower ${val} |
| SuperTrend | Dynamic trend line | - | ${val} |
| FIB | Fibonacci ratios | 0.382=${val} | 0.618=${val} |
| VWAP | Volume benchmark | - | ${val} |
| MA(60) | Long-period MA | - | ${val} |
```

---

## Case 8: Volatility

**Triggers**: "is volatility high", "volatility", "ATR"

**Default indicators** (2 indicators, 2 dimensions):

```python
config = {
    "ATR": {"period": 14},                  # absolute range
    "BOLL": {"period": 20, "std_dev": 2},   # relative volatility
}
```

**Output template**:

```markdown
## {SYMBOL} Volatility Analysis ({GRANULARITY})

**Overall: {conclusion}**

| Dimension | Indicator | Recent Trend (last {TAIL} bars) | Current |
|-----------|-----------|--------------------------------|---------|
| Absolute range | ATR (14) | {rising/falling/stable} | ${val} ({pct}% of price) |
| Relative volatility | BOLL | bandwidth {expanding/contracting} | {squeeze/expansion} |
```

---

## Case 9: Indicator Info / List

**Triggers**: "what indicators are available", "how does RSI work", "what are MACD parameters"

**AI behavior**: No calculation needed — return indicator info directly from indicators.md.
