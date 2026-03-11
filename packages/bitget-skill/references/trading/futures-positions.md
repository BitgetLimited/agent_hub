# futures_get_positions — Futures Positions

## Official Description
Get current open positions or position history for futures contracts. Returns full position details including size, entry price, leverage, unrealized PnL, liquidation price, and margin.

**Endpoints:**
- Current positions: `GET /api/v2/mix/position/single-position` (single) | `GET /api/v2/mix/position/all-position` (all)
- Position history: `GET /api/v2/mix/position/history-position`

**Auth required:** Yes
**Rate limit:** 10 req/s per UID

---

## bgc CLI Usage

```bash
bgc futures futures_get_positions \
  --productType <PRODUCT_TYPE> \
  [--symbol <SYMBOL>] \
  [--marginCoin <coin>] \
  [--history true]
```

---

## Parameters

| Parameter | Type | Required | Allowed Values | Description |
|-----------|------|----------|----------------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `COIN-FUTURES`, `USDC-FUTURES` | Contract type |
| `symbol` | string | No | e.g. `BTCUSDT` | Filter to one contract |
| `marginCoin` | string | No | e.g. `USDT` | Filter by margin coin |
| `history` | boolean | No | `true` | Get closed position history instead of open |

---

## Key Response Fields (Current Positions)

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Contract pair |
| `holdSide` | string | `long` or `short` |
| `marginMode` | string | `isolated` or `crossed` |
| `marginCoin` | string | Collateral coin |
| `margin` | string | Margin allocated to this position |
| `available` | string | Closeable size |
| `total` | string | Total position size |
| `openPriceAvg` | string | Average entry price |
| `leverage` | string | Current leverage |
| `unrealizedPL` | string | Unrealized profit/loss |
| `liquidationPrice` | string | Liquidation price |
| `keepMarginRate` | string | Maintenance margin rate |
| `achievedProfits` | string | Realized PnL (partial closes) |
| `marketPrice` | string | Current mark price |
| `autoMargin` | string | Auto-margin status: `on` or `off` |
| `cTime` | string | Position opened timestamp (ms) |
| `uTime` | string | Last updated timestamp (ms) |

---

## Before Closing a Position — Read This First

Always run this before placing a close order:
```bash
bgc futures futures_get_positions --productType USDT-FUTURES --symbol BTCUSDT
```

From the response, note:
- **`holdSide`**: `long` or `short` — determines which `side` to use for closing
- **`posMode`**: `one_way_mode` or `hedge_mode` — determines which close method to use
- **`available`**: closeable size — use this as max `size` in your close order
- **`total`**: total size (may differ from `available` if reduce-only orders already exist)

### Closing cheatsheet based on what you see

| `holdSide` | `posMode` | Close order `side` | Extra param |
|------------|-----------|-------------------|-------------|
| `long` | `one_way_mode` | `sell` | `reduceOnly: "YES"` |
| `short` | `one_way_mode` | `buy` | `reduceOnly: "YES"` |
| `long` | `hedge_mode` | `sell` | `tradeSide: "close"` |
| `short` | `hedge_mode` | `buy` | `tradeSide: "close"` |

**Common mistake**: Using `sell` to close a `short` — this opens MORE short, it does not close it.

---

## Usage Cases

### Case 1: View all open positions (USDT futures)
```bash
bgc futures futures_get_positions --productType USDT-FUTURES
```
> Shows all open longs and shorts across all USDT-margined contracts.

### Case 2: Check position for a specific contract
```bash
bgc futures futures_get_positions --productType USDT-FUTURES --symbol BTCUSDT
```
> Check size, entry price, unrealized PnL, and liquidation price for your BTC position.

### Case 3: Check COIN-margined positions
```bash
bgc futures futures_get_positions --productType COIN-FUTURES --marginCoin BTC
```

### Case 4: View position history (closed positions)
```bash
bgc futures futures_get_positions --productType USDT-FUTURES --history true
```
> Shows recently closed positions with realized PnL.

### Case 5: Assess liquidation risk
```bash
bgc futures futures_get_positions --productType USDT-FUTURES --symbol BTCUSDT
# Check "liquidationPrice" vs current market price
# Check "keepMarginRate" — higher means closer to liquidation
```

### Case 6: Check available size before placing close order
```bash
bgc futures futures_get_positions --productType USDT-FUTURES --symbol BTCUSDT
# Use "available" field as max size for close order
```

### Case 7: Monitor unrealized PnL across all positions
```bash
bgc futures futures_get_positions --productType USDT-FUTURES
# Sum "unrealizedPL" fields across all positions
```

---

## Hedge Mode vs One-Way Mode

In **hedge mode**, you may have both a long and short position on the same symbol simultaneously. Each appears as a separate position with `holdSide` of `long` or `short`.

In **one-way mode**, there is at most one position per symbol, with `holdSide` reflecting the current direction.

---

## Important Notes

- Positions with `total=0` are closed — they may briefly appear before being removed
- `available` may be less than `total` if you have open close orders occupying the position
- `liquidationPrice` is approximate — it changes as funding is applied
- For COIN-FUTURES, `margin` and PnL are denominated in the base coin (e.g., BTC), not USDT

---

## Official Docs
- All Positions: https://www.bitget.com/api-doc/contract/position/Get-All-Position
- Single Position: https://www.bitget.com/api-doc/contract/position/Get-Single-Position
- History Positions: https://www.bitget.com/api-doc/contract/position/Get-History-Position
