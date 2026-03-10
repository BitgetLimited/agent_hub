---
name: bitget-indicator
description: >
  Use this skill when the user asks about crypto technical analysis, technical indicators,
  trend direction, overbought/oversold, support/resistance, momentum, volatility, or volume
  analysis. Trigger keywords include: technical analysis, indicator, trend, overbought,
  oversold, support, resistance, momentum, volatility, volume, MACD, RSI, KDJ, BOLL,
  SuperTrend, EMA, MA, SAR, ATR, VWAP, FIB, StochRSI, MFI, DMI, OBV, ROC, CCI, WR,
  VOL, DMA, MTM, EMV, AVL. This applies even when the user doesn't say "indicator"
  explicitly — phrases like "is BTC overbought", "what's the trend", "where is support"
  all point to this skill.
---

# Bitget Technical Indicator Skill

23 crypto technical indicators across 6 categories (Trend, Volatility, Oscillator,
Volume, Momentum, Support/Resistance). Outputs recent time-series data so the AI can
observe trend evolution, not just a single point.

## Step 1: Check prerequisites

```bash
python -c "import pandas, numpy; print('OK')"
```

If missing:

```bash
pip install pandas numpy
```

## Step 2: Determine indicator selection

```
Priority 1: User-defined
  The user explicitly specified indicator names, parameters, or combinations.
  -> Do NOT read scenarios.md or indicators.md
  -> Go directly to Step 3 with the user's config
  -> Example: "analyze BTC with RSI(21) + EMA(50) + ATR"

Priority 2: Scenario defaults
  The user described analysis intent but did not specify indicators.
  -> Read ONLY references/scenarios.md to pick the right scenario config
  -> Do NOT read indicators.md
  -> Example: "how's BTC looking technically?"

Priority 3: Indicator info query
  The user asks about an indicator rather than requesting a calculation.
  -> Read ONLY references/indicators.md
  -> No calculation needed, answer directly
  -> Example: "how does RSI work?"
```

## Step 3: Run the calculation

The Python source is at `src/` relative to this SKILL.md file.

For Claude Code the skill directory is `~/.claude/skills/bitget-indicator-skill`.
For Codex it is `~/.codex/skills/bitget-indicator-skill`.

### Template A: Fetch from Bitget API (default)

When the user mentions a trading pair but provides no local data:

```python
import sys, os
sys.path.insert(0, os.path.expanduser('~/.claude/skills/bitget-indicator-skill/src'))
import json, urllib.request
import pandas as pd
from kline_indicator_utils import IndicatorManager

url = 'https://api.bitget.com/api/v2/spot/market/candles?symbol={SYMBOL}&granularity={GRANULARITY}&limit={LIMIT}'
raw = json.loads(urllib.request.urlopen(url).read())
df = pd.DataFrame(raw['data'], columns=['timestamp', 'open', 'high', 'low', 'close', 'volume', 'quoteVol', 'amount'])
for col in ['open', 'high', 'low', 'close', 'volume', 'amount']:
    df[col] = df[col].astype(float)

config = {CONFIG}

manager = IndicatorManager(show_indicators=False)
output = manager.calculate_and_export(config, df, tail={TAIL})
output["symbol"] = "{SYMBOL}"
output["granularity"] = "{GRANULARITY}"
print(json.dumps(output, indent=2))
```

### Template B: Local data

When the user provides a local file path (CSV / Parquet / JSON):

```python
import sys, os
sys.path.insert(0, os.path.expanduser('~/.claude/skills/bitget-indicator-skill/src'))
import json
import pandas as pd
from kline_indicator_utils import IndicatorManager

df = pd.read_csv('{FILE_PATH}')  # or pd.read_parquet / pd.read_json
df.columns = df.columns.str.lower()

for col in ['open', 'high', 'low', 'close', 'volume']:
    df[col] = df[col].astype(float)

config = {CONFIG}

manager = IndicatorManager(show_indicators=False)
output = manager.calculate_and_export(config, df, tail={TAIL})
output["source"] = "local: {FILE_PATH}"
print(json.dumps(output, indent=2))
```

### Template C: Export full series to CSV

When the user asks for "full data", "export", or wants data for plotting/backtesting:

```python
output = manager.calculate_and_export(config, df, tail={TAIL}, csv_path='{CSV_PATH}')
```

This saves OHLCV + all indicator columns to CSV for downstream use.

### Template variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SYMBOL` | Trading pair | `BTCUSDT`, `ETHUSDT` |
| `GRANULARITY` | Kline interval | `1h`, `4h`, `1d`, `15min` |
| `LIMIT` | Number of klines | `200` (default) |
| `CONFIG` | Indicator config dict | See scenarios.md |
| `TAIL` | Number of recent bars in series output | `20` (default) |
| `CSV_PATH` | File path for CSV export (optional) | `./btc_indicators.csv` |

### Choosing TAIL

| Granularity | Suggested TAIL |
|-------------|---------------|
| 1min, 5min | 30-50 |
| 15min, 30min | 20-30 |
| 1h, 4h | 20 (default) |
| 1d, 1w | 10-15 |

### Bitget API interval mapping

| User says | granularity value |
|-----------|-------------------|
| 1 minute | `1min` |
| 5 minutes | `5min` |
| 15 minutes | `15min` |
| 30 minutes | `30min` |
| 1 hour | `1h` |
| 4 hours | `4h` |
| daily | `1d` |
| weekly | `1w` |

### Futures klines

Use a different API endpoint for futures:

```python
url = 'https://api.bitget.com/api/v2/mix/market/candles?productType=USDT-FUTURES&symbol={SYMBOL}&granularity={GRANULARITY}&limit={LIMIT}'
```

**Data requirement**: DataFrame must contain at least `open`, `high`, `low`, `close`, `volume` columns (float). Optional: `amount`, `timestamp`. Column names are case-insensitive — normalize to lowercase.

## Output format

The JSON output contains time-series arrays (not single points), so the AI can observe
trend evolution and write natural-language interpretation.

### For most indicators: `series` + `context`

```json
{
  "MACD": {
    "series": {
      "DIF": [-120.5, -135.2, ..., -180.66],
      "DEA": [-85.1, -86.3, ..., -88.34],
      "HIST": [-70.8, -97.8, ..., -184.63]
    },
    "context": {
      "trend_streak": 7,
      "last_cross_up_bars_ago": 23,
      "last_cross_down_bars_ago": 9
    }
  }
}
```

### For FIB: `levels` + `context`

FIB outputs static price levels for the lookback window — series is not meaningful:

```json
{
  "FIB": {
    "levels": {
      "fib_high": 89200.5,
      "fib_236": 88750.2,
      "fib_382": 88430.1,
      "fib_500": 88100.0,
      "fib_618": 87770.3,
      "fib_786": 87340.5,
      "fib_low": 86950.0,
      "fib_strength": 35.2
    },
    "context": { "trend_streak": 12 }
  }
}
```

### How to interpret and present

1. Read the series arrays — identify patterns: HIST narrowing/widening, RSI rising/falling, DIF/DEA converging/diverging, bandwidth expanding/contracting.
2. Write a **conclusion-first** summary (one line), then a table showing each indicator's recent behavior and current value.
3. For FIB, present as a price level table with the current price position marked.

Example output format:

```markdown
## {SYMBOL} Technical Analysis ({GRANULARITY})

**Overall: {conclusion}**

| Dimension | Indicator | Recent Trend (last {TAIL} bars) | Current |
|-----------|-----------|--------------------------------|---------|
| Trend | SuperTrend | direction held for {N} bars | bullish |
| Momentum | MACD | HIST narrowing, DIF/DEA converging | DIF=-180.7 |
| Overbought/Oversold | RSI (14) | falling from 55 to 40 | 40.3 |
```

## Agent behavior rules

1. **Indicator selection priority**: user-defined > scenario defaults > info query. When the user specifies indicators or parameters, follow them exactly — do not force a scenario template.

2. **Precision rule**: infer decimal places from the kline close price (e.g. BTC 63500.12 -> 2 decimals, DOGE 0.0835 -> 4 decimals). Round series values at that precision before presenting in tables; the raw JSON may have higher precision.

3. **Conflicting indicators**: present both sides objectively, do not favor either direction.

4. **No trading advice**: present data objectively. End with "The above is objective technical indicator data and does not constitute trading advice."

5. **Label data source**: always show timeframe, kline count, and data source (Bitget API / local file path).

## Reference docs

- [scenarios.md](references/scenarios.md) — 9 scenarios with indicator selection guide and output templates
- [indicators.md](references/indicators.md) — 23 indicator quick reference (params, outputs, signals)
