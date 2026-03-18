# Backtest Strategy Schema Reference

## Full Strategy Config

```json
{
  "name": "Strategy Name",
  "symbols": ["BTC/USDT"],
  "timeframe": "1d",
  "indicators": [
    {"name": "rsi", "params": {"period": 14}, "key": "rsi"},
    {"name": "ema", "params": {"period": 20}, "key": "ema20"},
    {"name": "bbands", "params": {"period": 20, "std": 2}, "key": "bb"}
  ],
  "entry_conditions": [
    {"indicator": "rsi", "operator": "<", "value": 30},
    {"indicator": "ema20", "operator": "crosses_above", "field": "close"}
  ],
  "exit_conditions": [
    {"indicator": "rsi", "operator": ">", "value": 70}
  ],
  "direction": "long",
  "stop_loss_pct": 5,
  "take_profit_pct": 15,
  "trade_size_pct": 1.0,
  "fees": 0.001
}
```

## Supported Indicators

| Name | Params | Output keys |
|------|--------|------------|
| `rsi` | `period` (default 14) | `rsi` |
| `sma` | `period` | `sma` |
| `ema` | `period` | `ema` |
| `macd` | `fast`, `slow`, `signal` | `macd`, `signal`, `histogram` |
| `bbands` | `period`, `std` | `upper`, `middle`, `lower`, `pct_b` |
| `atr` | `period` | `atr`, `atr_pct` |

## Operators

| Operator | Meaning |
|----------|---------|
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or equal |
| `<=` | Less than or equal |
| `crosses_above` | Indicator crosses above field/value (requires `field` or `value`) |
| `crosses_below` | Indicator crosses below field/value |

## Direction

| Value | Behavior |
|-------|---------|
| `long` | Only long entries |
| `short` | Only short entries |
| `both` | Both long and short |

## Period Strings

`30d`, `90d`, `6m`, `1y`, `2y`

Recommended: use at least `90d` for statistical significance. `30d` may have too few trades.

## Symbol Format

- Spot: `BTC/USDT` (slash notation — required)
- Futures: `BTC/USDT:USDT`
- Never use: `BTCUSDT` (no slash = will fail)

## Common Strategy Patterns

### RSI Mean Reversion
```json
{
  "entry_conditions": [{"indicator": "rsi", "operator": "<", "value": 30}],
  "exit_conditions": [{"indicator": "rsi", "operator": ">", "value": 70}],
  "direction": "long",
  "stop_loss_pct": 5
}
```

### EMA Golden/Death Cross
```json
{
  "indicators": [
    {"name": "ema", "params": {"period": 9}, "key": "ema9"},
    {"name": "ema", "params": {"period": 21}, "key": "ema21"}
  ],
  "entry_conditions": [{"indicator": "ema9", "operator": "crosses_above", "field": "ema21"}],
  "exit_conditions": [{"indicator": "ema9", "operator": "crosses_below", "field": "ema21"}]
}
```

### Bollinger Band Squeeze Entry
```json
{
  "indicators": [
    {"name": "bbands", "params": {"period": 20, "std": 2}, "key": "bb"},
    {"name": "rsi", "params": {"period": 14}, "key": "rsi"}
  ],
  "entry_conditions": [
    {"indicator": "bb", "field": "pct_b", "operator": "<", "value": 0.1},
    {"indicator": "rsi", "operator": "<", "value": 40}
  ],
  "exit_conditions": [
    {"indicator": "bb", "field": "pct_b", "operator": ">", "value": 0.9}
  ]
}
```

### MACD Momentum
```json
{
  "indicators": [
    {"name": "macd", "params": {"fast": 12, "slow": 26, "signal": 9}, "key": "macd"}
  ],
  "entry_conditions": [
    {"indicator": "macd", "field": "histogram", "operator": "crosses_above", "value": 0}
  ],
  "exit_conditions": [
    {"indicator": "macd", "field": "histogram", "operator": "crosses_below", "value": 0}
  ]
}
```

## Backtest Result Metrics

| Metric | What it means | Good threshold |
|--------|---------------|----------------|
| `total_return_pct` | Strategy return over period | Depends on buy-and-hold comparison |
| `sharpe_ratio` | Risk-adjusted return | > 1.0 acceptable, > 2.0 good |
| `max_drawdown_pct` | Largest peak-to-trough decline | < 20% preferred |
| `win_rate` | % of profitable trades | > 50% (but not the only metric) |
| `total_trades` | Number of trades | < 10 = too few for statistical confidence |
| `profit_factor` | Gross profit / gross loss | > 1.5 indicates edge |
| `buy_hold_return_pct` | Passive hold return for comparison | — |

Statistical note: if `total_trades < 15`, caveat the results as potentially insufficient
for confidence. The strategy may look good purely by luck.
