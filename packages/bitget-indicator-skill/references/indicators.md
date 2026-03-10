# Technical Indicator Quick Reference (23)

## Trend (7)

### MA — Moving Average

| Field | Details |
|-------|---------|
| **Params** | `period=60` |
| **Output** | `MA_{period}` |
| **Signals** | cross_up (price crosses above MA), cross_down (price crosses below MA), trend |
| **Interpretation** | Price above MA = bullish, below = bearish. Common periods: 10/20/60/200 |
| **Crypto note** | MA60 and MA200 for long-term trend; MA10/MA20 for short-term |

### EMA — Exponential Moving Average

| Field | Details |
|-------|---------|
| **Params** | `period=60` |
| **Output** | `EMA_{period}` |
| **Signals** | cross_up, cross_down, trend |
| **Interpretation** | More responsive to recent prices than MA; better for fast-moving markets |
| **Crypto note** | EMA12/EMA26 (MACD basis); EMA50/EMA200 (golden/death cross) |

### SAR — Parabolic SAR

| Field | Details |
|-------|---------|
| **Params** | `af_start=0.02, af_increment=0.02, af_max=0.2` |
| **Output** | `SAR` |
| **Signals** | cross_up (trend turns bullish), cross_down (turns bearish), trend (1=bull/-1=bear) |
| **Interpretation** | SAR below price = bullish, above = bearish; auto-accelerates to track trend |
| **Crypto note** | Works well in trending markets; noisy in sideways — pair with other filters |

### AVL — Average Price Line

| Field | Details |
|-------|---------|
| **Params** | `period=1` |
| **Output** | `AVL` |
| **Signals** | cross_up, cross_down, trend |
| **Interpretation** | Volume-weighted average price for the current period; price above AVL means most participants are in profit |
| **Crypto note** | Intraday reference; requires `amount` column (falls back to close*volume) |

### MACD — Moving Average Convergence Divergence

| Field | Details |
|-------|---------|
| **Params** | `fast=12, slow=26, signal=9` |
| **Output** | `DIF`, `DEA`, `HIST` |
| **Signals** | cross_up (golden cross), cross_down (death cross), trend |
| **Interpretation** | DIF crossing above DEA = buy signal; HIST increasing = momentum growing |
| **Crypto note** | Most widely used trend indicator; golden cross above zero line is more reliable |

### DMI — Directional Movement Index

| Field | Details |
|-------|---------|
| **Params** | `n1=14, n2=14` |
| **Output** | `ADX_{n1}_{n2}`, `DI_PLUS_{n1}`, `DI_MINUS_{n1}` |
| **Signals** | cross_up (DI+ crosses above DI-), cross_down (DI+ crosses below DI-), trend |
| **Interpretation** | ADX measures trend strength (direction-agnostic); ADX>25 = clear trend, >50 = very strong |
| **Crypto note** | ADX<20 = ranging market, avoid trend strategies; DI+ > DI- = bulls dominate |

### SuperTrend — Super Trend

| Field | Details |
|-------|---------|
| **Params** | `period=10, multiplier=3.0` |
| **Output** | `SuperTrend` (trend line price), `Direction` (1=bull, -1=bear) |
| **Signals** | cross_up (turns bullish), cross_down (turns bearish), trend |
| **Interpretation** | ATR-adaptive trend line; Direction=1 means SuperTrend acts as dynamic support below price |
| **Crypto note** | One of the most practical crypto trend indicators; multiplier=3.0 for most cases, 2.0 for altcoins |

---

## Volatility (2)

### BOLL — Bollinger Bands

| Field | Details |
|-------|---------|
| **Params** | `period=20, std_dev=2` |
| **Output** | `UPPER`, `MIDDLE`, `LOWER` |
| **Signals** | cross_up (bounces from lower through middle), cross_down (drops from upper through middle), trend |
| **Interpretation** | Squeeze = imminent breakout; price touching upper band = overbought, lower = oversold |
| **Crypto note** | Crypto volatility is high — std_dev=2.5 may work better; breakout direction after squeeze is valuable |

### ATR — Average True Range

| Field | Details |
|-------|---------|
| **Params** | `period=14` |
| **Output** | `ATR` |
| **Signals** | None (pure volatility measure) |
| **Interpretation** | Moving average of true range; used for stop-loss placement (e.g. 2x ATR) and position sizing |
| **Crypto note** | BTC ATR typically $500–$3000; ATR% is more meaningful for altcoins |

---

## Oscillator (6)

### KDJ — Stochastic

| Field | Details |
|-------|---------|
| **Params** | `period=9, overbought=80, oversold=20` |
| **Output** | `K`, `D`, `J` |
| **Signals** | cross_up (K crosses above D), cross_down (K crosses below D), trend |
| **Interpretation** | J can exceed 100 or go below 0 for extreme signals; D<20 with golden cross = strong buy |
| **Crypto note** | Standard indicator in Asian markets; extreme J values (>100 or <0) confirmed by volume are more reliable |

### RSI — Relative Strength Index

| Field | Details |
|-------|---------|
| **Params** | `period=14, overbought=70, oversold=30` |
| **Output** | `RSI_{period}` |
| **Signals** | cross_up (exits oversold), cross_down (enters overbought), trend |
| **Interpretation** | 0–100 range; >70 overbought, <30 oversold; can stay extreme in strong trends |
| **Crypto note** | Given crypto volatility, consider overbought=80, oversold=20 |

### ROC — Rate of Change

| Field | Details |
|-------|---------|
| **Params** | `period=20, buy_threshold=0.05, sell_threshold=-0.05` |
| **Output** | `ROC_{period}` |
| **Signals** | cross_up, cross_down, trend |
| **Interpretation** | Shows N-period price change as percentage; simple, intuitive momentum indicator |
| **Crypto note** | Altcoins may need wider thresholds (e.g. ±10%) |

### CCI — Commodity Channel Index

| Field | Details |
|-------|---------|
| **Params** | `period=14, overbought=100, oversold=-100` |
| **Output** | `CCI_{period}` |
| **Signals** | cross_up (exits below -100), cross_down (exits above 100), trend |
| **Interpretation** | Not bounded to 0–100; can reach ±200 or beyond. CCI>100 = strong, <-100 = weak |
| **Crypto note** | CCI can stay above ±200 for extended periods during major moves |

### WR — Williams %R

| Field | Details |
|-------|---------|
| **Params** | `period=14, overbought=20, oversold=80` |
| **Output** | `WR_{period}` |
| **Signals** | cross_up, cross_down, trend |
| **Interpretation** | 0–100 range but reversed vs RSI; WR<20 = overbought, WR>80 = oversold |
| **Crypto note** | Very similar to KDJ — typically use one or the other |

### StochRSI — Stochastic RSI

| Field | Details |
|-------|---------|
| **Params** | `n=120, m=20, overbought=60, oversold=40` |
| **Output** | `StochRSI_{n}_{m}` |
| **Signals** | cross_up, cross_down, trend |
| **Interpretation** | RSI applied twice (stochastic of RSI); more sensitive, can give 2–3 bar early warning |
| **Crypto note** | High sensitivity means more false signals — pair with a trend filter |

---

## Volume (4)

### VOL — Volume

| Field | Details |
|-------|---------|
| **Params** | `period=20` |
| **Output** | `VOLMA_{period}` |
| **Signals** | cross_up (volume surge), cross_down (volume drop), trend |
| **Interpretation** | Compare current volume to moving average; rising price + high volume = healthy trend |
| **Crypto note** | Crypto trades 24/7 — volume rhythm differs from stocks; watch for sudden spikes |

### OBV — On-Balance Volume

| Field | Details |
|-------|---------|
| **Params** | `fast_period=10, slow_period=30` |
| **Output** | `OBV_HISTOGRAM` |
| **Signals** | cross_up (histogram crosses above 0), cross_down (crosses below 0), trend |
| **Interpretation** | Cumulative volume fast/slow EMA difference; positive = money flowing in, negative = flowing out |
| **Crypto note** | Price-volume divergence (new high in price but not in OBV) is a key reversal warning |

### MFI — Money Flow Index

| Field | Details |
|-------|---------|
| **Params** | `period=14, up_threshold=58, down_threshold=42` |
| **Output** | `MFI_{period}` |
| **Signals** | cross_up, cross_down, trend |
| **Interpretation** | "RSI with volume"; 0–100 range, >58 bullish, <42 bearish |
| **Crypto note** | MFI-confirmed overbought/oversold is more reliable than RSI alone |

### VWAP — Volume Weighted Average Price

| Field | Details |
|-------|---------|
| **Params** | `period=20` |
| **Output** | `VWAP_{period}` |
| **Signals** | cross_up (price crosses above VWAP), cross_down (crosses below), trend |
| **Interpretation** | True average price weighted by volume; institutional benchmark for fair value |
| **Crypto note** | Intraday traders watch price relative to VWAP; especially important in futures |

---

## Momentum (3)

### DMA — Displaced Moving Average Difference

| Field | Details |
|-------|---------|
| **Params** | `short=10, long=50, signal=10` |
| **Output** | `DMA`, `AMA` |
| **Signals** | cross_up (DMA crosses above AMA), cross_down (DMA crosses below AMA), trend |
| **Interpretation** | DMA = short MA − long MA; similar concept to MACD but uses SMA |
| **Crypto note** | Customize short/long periods to match your trading timeframe |

### MTM — Momentum

| Field | Details |
|-------|---------|
| **Params** | `period=60` |
| **Output** | `MTM_{period}` |
| **Signals** | cross_up (crosses above 0), cross_down (crosses below 0), trend |
| **Interpretation** | MTM = current price − price N periods ago; positive = rising, negative = falling |
| **Crypto note** | Unlike ROC (percentage), MTM is absolute — high-priced coins show large MTM without large % moves |

### EMV — Ease of Movement

| Field | Details |
|-------|---------|
| **Params** | `period=14` |
| **Output** | `EMV`, `EMV_MA` |
| **Signals** | cross_up (EMV crosses above EMV_MA), cross_down (crosses below), trend |
| **Interpretation** | Measures how "easily" price moves; EMV>0 = price rising easily (low volume, big move), EMV<0 = declining |
| **Crypto note** | Unique volume-price relationship indicator; low EMV + price rising = upward resistance |

---

## Support / Resistance (1)

### FIB — Fibonacci Retracement

| Field | Details |
|-------|---------|
| **Params** | `n=20, m=5, buy_threshold=20, sell_threshold=80` |
| **Output** | `fib_high`, `fib_236`, `fib_382`, `fib_500`, `fib_618`, `fib_786`, `fib_low`, `fib_strength_{n}_{m}` |
| **Signals** | cross_up, cross_down, trend |
| **Interpretation** | Auto-calculates Fibonacci retracement levels over N periods; 0.382/0.5/0.618 are the most critical |
| **Crypto note** | The 0.618 level is widely watched in crypto; multiple indicators converging at the same price = strong S/R |

---

## Signal conventions

All indicators use a unified signal format:

| Signal | Meaning | Values |
|--------|---------|--------|
| `cross_up` | Bullish signal triggered | 1=triggered, 0=not triggered |
| `cross_down` | Bearish signal triggered | 1=triggered, 0=not triggered |
| `trend` | Current trend direction | 1=bullish, -1=bearish, 0=neutral |
