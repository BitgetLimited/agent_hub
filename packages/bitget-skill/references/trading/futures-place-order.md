# futures_place_order — Futures Place Order

## Official Description
Place one or more futures perpetual contract orders with optional take-profit/stop-loss presets. Supports both one-way and hedge position modes.

**Endpoint:** `POST /api/v2/mix/order/place-order` (single) | `POST /api/v2/mix/order/batch-place-order` (batch)
**Auth required:** Yes
**Rate limit:** 10 req/s per UID; batch: 5 req/s

---

## ⚠️ CRITICAL: How to Close a Position

**The most common mistake is using the wrong `side` when closing.** The rule is:

| To close... | Use `side` | Why |
|-------------|------------|-----|
| Close a **long** | `sell` | You bought to open, you sell to close |
| Close a **short** | `buy` | You sold to open, you buy to close |

**Never use `sell` to close a short — that opens MORE short, it does not close it.**

### One-Way Mode Close (use `reduceOnly`)

```bash
# Close LONG: side=sell + reduceOnly=YES
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "sell", "orderType": "market", "force": "gtc",
  "size": "0.01", "reduceOnly": "YES"
}]'

# Close SHORT: side=buy + reduceOnly=YES
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "buy", "orderType": "market", "force": "gtc",
  "size": "0.01", "reduceOnly": "YES"
}]'
```

> `reduceOnly=YES` is essential — it prevents the order from accidentally flipping into an opposite position if the size exceeds what you hold.

### Hedge Mode Close (use `tradeSide=close`)

```bash
# Close LONG in hedge mode: side=sell + tradeSide=close
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "sell", "tradeSide": "close",
  "orderType": "market", "force": "gtc", "size": "0.01"
}]'

# Close SHORT in hedge mode: side=buy + tradeSide=close
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "buy", "tradeSide": "close",
  "orderType": "market", "force": "gtc", "size": "0.01"
}]'
```

---

## ⚠️ CRITICAL: TP/SL Without Plan Orders

**There is no `futures_place_plan_order` in the bgc CLI.** The options are:

1. **Preset TP/SL on the entry order** — `presetStopSurplusPrice` / `presetStopLossPrice` set at order placement
2. **Add/modify TP/SL after placement** — `futures_modify_order` with `newPresetStopSurplusPrice` / `newPresetStopLossPrice`; does **not** cancel the order; pass `"0"` to delete
3. **Manual limit order with `reduceOnly=YES`** — place a separate limit close order at your target price

### TP/SL Preset (set when opening position)

```bash
# Open long with TP at 72000 and SL at 61000
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "buy", "orderType": "limit", "force": "gtc",
  "price": "65000", "size": "0.01",
  "presetStopSurplusPrice": "72000",
  "presetStopLossPrice": "61000"
}]'
```

> Presets are trigger prices. The position closes at market once the mark price hits the trigger.

### Manual TP: Limit Close Order with reduceOnly

```bash
# Already holding a long. Place a take-profit limit sell at 72000.
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "sell", "orderType": "limit", "force": "gtc",
  "price": "72000", "size": "0.01",
  "reduceOnly": "YES"
}]'
```

> This rests as a pending limit order in the book. When price hits 72000, it fills and closes the long.

### Manual SL: Limit Close Order with reduceOnly

```bash
# Already holding a long. Place a stop-loss limit sell at 61000.
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "sell", "orderType": "limit", "force": "gtc",
  "price": "61000", "size": "0.01",
  "reduceOnly": "YES"
}]'
```

> ⚠️ A limit SL may not fill in a fast-moving market — it can be skipped if price gaps through. For hard stops, prefer the `presetStopLossPrice` preset (market execution on trigger).

---

## bgc CLI Usage

```bash
bgc futures futures_place_order --orders '<JSON array>'
```

---

## Order Object Parameters

| Parameter | Type | Required | Allowed Values | Description |
|-----------|------|----------|----------------|-------------|
| `symbol` | string | Yes | e.g. `BTCUSDT` | Contract symbol (uppercase) |
| `productType` | string | Yes | `USDT-FUTURES`, `COIN-FUTURES`, `USDC-FUTURES` | Contract product type |
| `marginMode` | string | Yes | `isolated`, `crossed` | Margin mode for this order |
| `marginCoin` | string | Yes | e.g. `USDT`, `BTC` | Collateral coin (must match productType) |
| `size` | string | Yes | e.g. `"0.01"` | Order size in base coin |
| `price` | string | Conditional | e.g. `"65000"` | Required for limit orders |
| `side` | string | Yes | `buy`, `sell` | Order direction (see close table above) |
| `tradeSide` | string | Conditional | `open`, `close` | **Hedge mode only** — omit in one-way mode |
| `orderType` | string | Yes | `limit`, `market` | Order type |
| `force` | string | Conditional | `gtc`, `ioc`, `fok`, `post_only` | Required for limit orders; default `gtc` |
| `clientOid` | string | No | e.g. `"fut-001"` | Custom order ID |
| `reduceOnly` | string | No | `YES`, `NO` (default) | **One-way mode only**: ensures order only reduces/closes position |
| `presetStopSurplusPrice` | string | No | e.g. `"70000"` | Take-profit trigger price (mark price) |
| `presetStopSurplusExecutePrice` | string | No | e.g. `"69900"` | TP execution price (limit); omit for market TP |
| `presetStopLossPrice` | string | No | e.g. `"60000"` | Stop-loss trigger price (mark price) |
| `presetStopLossExecutePrice` | string | No | e.g. `"59900"` | SL execution price (limit); omit for market SL |
| `stpMode` | string | No | `none`, `cancel_taker`, `cancel_maker`, `cancel_both` | Self-trade prevention |

---

## Position Mode Logic

### One-Way Mode (default for most accounts)

`tradeSide` is **NOT used** in one-way mode — omit it entirely. Use `side` + `reduceOnly`:

| Action | `side` | `reduceOnly` |
|--------|--------|--------------|
| Open long | `buy` | `NO` (or omit) |
| Open short | `sell` | `NO` (or omit) |
| Close long | `sell` | `YES` |
| Close short | `buy` | `YES` |

### Hedge Mode

`tradeSide` is **required** in hedge mode. Do NOT use `reduceOnly`:

| Action | `side` | `tradeSide` |
|--------|--------|-------------|
| Open long | `buy` | `open` |
| Open short | `sell` | `open` |
| Close long | `sell` | `close` |
| Close short | `buy` | `close` |

> **How to check your mode:** `bgc futures futures_get_positions --productType USDT-FUTURES --symbol BTCUSDT` — look at `posMode` field: `one_way_mode` or `hedge_mode`.

---

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "No position to close" / "position not found" | Wrong `side` direction for close, or wrong mode params | Check `holdSide` in positions; use the close table above |
| "Type mismatch" / parameter error | Using `tradeSide` in one-way mode, or omitting it in hedge mode | Check your `posMode` first; match params to mode |
| "Insufficient balance" on close order | Order was interpreted as an **open** (not a close), consuming margin | Add `reduceOnly=YES` (one-way) or `tradeSide=close` (hedge) |
| Close order turns into open | No `reduceOnly` or wrong `tradeSide` | Always add close protection params |
| TP/SL not triggered | `presetStopSurplusPrice` / `presetStopLossPrice` are trigger prices vs **mark price** | Verify mark price direction matches trigger |

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | Exchange-assigned order ID |
| `clientOid` | string | Your custom order ID |

---

## Usage Cases

### Case 1: Open long — limit order (one-way mode)
```bash
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT",
  "productType": "USDT-FUTURES",
  "marginMode": "crossed",
  "marginCoin": "USDT",
  "side": "buy",
  "orderType": "limit",
  "force": "gtc",
  "price": "65000",
  "size": "0.01"
}]'
```

### Case 2: Open short — limit order (one-way mode)
```bash
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT",
  "productType": "USDT-FUTURES",
  "marginMode": "crossed",
  "marginCoin": "USDT",
  "side": "sell",
  "orderType": "limit",
  "force": "gtc",
  "price": "68000",
  "size": "0.01"
}]'
```

### Case 3: Open short — with preset TP/SL at entry
```bash
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT",
  "productType": "USDT-FUTURES",
  "marginMode": "isolated",
  "marginCoin": "USDT",
  "side": "sell",
  "orderType": "limit",
  "force": "gtc",
  "price": "67000",
  "size": "0.01",
  "presetStopSurplusPrice": "63000",
  "presetStopLossPrice": "70000"
}]'
```
> Short at $67,000. TP at $63,000 (price falls = profit). SL at $70,000 (price rises = loss protected).
> The close direction (`buy`) is handled automatically by the preset — you do not specify it.

### Case 4: Close long — market (one-way mode)
```bash
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT",
  "productType": "USDT-FUTURES",
  "marginMode": "crossed",
  "marginCoin": "USDT",
  "side": "sell",
  "orderType": "market",
  "force": "gtc",
  "size": "0.01",
  "reduceOnly": "YES"
}]'
```

### Case 5: Close short — market (one-way mode)
```bash
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT",
  "productType": "USDT-FUTURES",
  "marginMode": "crossed",
  "marginCoin": "USDT",
  "side": "buy",
  "orderType": "market",
  "force": "gtc",
  "size": "0.01",
  "reduceOnly": "YES"
}]'
```
> **Short = opened with `sell`. To close: `buy` + `reduceOnly=YES`.**

### Case 6: Place TP + SL as separate limit orders after opening (one-way mode)
```bash
# Assume holding 0.01 BTC long. Place both orders simultaneously.

# Take-profit at 72000
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "sell", "orderType": "limit", "force": "gtc",
  "price": "72000", "size": "0.01", "reduceOnly": "YES"
}]'

# Stop-loss at 61000
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "sell", "orderType": "limit", "force": "gtc",
  "price": "61000", "size": "0.01", "reduceOnly": "YES"
}]'
```
> Both orders have `reduceOnly=YES` so they won't add to position. Whichever fills first, the system will auto-cancel the other (if it would exceed available position size).

### Case 7: Hedge mode — open long
```bash
bgc futures futures_place_order --orders '[{
  "symbol": "ETHUSDT",
  "productType": "USDT-FUTURES",
  "marginMode": "crossed",
  "marginCoin": "USDT",
  "side": "buy",
  "tradeSide": "open",
  "orderType": "limit",
  "force": "gtc",
  "price": "3200",
  "size": "1"
}]'
```

### Case 8: Hedge mode — close short
```bash
bgc futures futures_place_order --orders '[{
  "symbol": "ETHUSDT",
  "productType": "USDT-FUTURES",
  "marginMode": "crossed",
  "marginCoin": "USDT",
  "side": "buy",
  "tradeSide": "close",
  "orderType": "market",
  "force": "gtc",
  "size": "1"
}]'
```
> Closing a short uses `side=buy` + `tradeSide=close`. Do NOT use `reduceOnly` in hedge mode.

### Case 9: COIN-margined (inverse) — open long BTC
```bash
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSD",
  "productType": "COIN-FUTURES",
  "marginMode": "crossed",
  "marginCoin": "BTC",
  "side": "buy",
  "orderType": "market",
  "force": "gtc",
  "size": "1"
}]'
```

### Case 10: Full TP/SL preset with execution prices
```bash
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT",
  "productType": "USDT-FUTURES",
  "marginMode": "isolated",
  "marginCoin": "USDT",
  "side": "buy",
  "orderType": "limit",
  "force": "gtc",
  "price": "65000",
  "size": "0.01",
  "presetStopSurplusPrice": "72000",
  "presetStopSurplusExecutePrice": "71900",
  "presetStopLossPrice": "61000",
  "presetStopLossExecutePrice": "60900"
}]'
```
> `presetStopSurplusExecutePrice` / `presetStopLossExecutePrice` set execution as limit prices.
> Omit them to execute at market price when trigger is hit.

---

## Step-by-Step: Open and Manage a Position (One-Way Mode)

```bash
# Step 1: Check current position mode
bgc futures futures_get_positions --productType USDT-FUTURES --symbol BTCUSDT
# Look for posMode: "one_way_mode"

# Step 2: Open long with preset TP/SL
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "buy", "orderType": "limit", "force": "gtc",
  "price": "65000", "size": "0.01",
  "presetStopSurplusPrice": "72000",
  "presetStopLossPrice": "61000"
}]'

# Step 3: (Optional) Add additional TP limit order
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "sell", "orderType": "limit", "force": "gtc",
  "price": "72000", "size": "0.01", "reduceOnly": "YES"
}]'

# Step 4: Emergency close at market
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "sell", "orderType": "market", "force": "gtc",
  "size": "0.01", "reduceOnly": "YES"
}]'
```

---

## Important Notes

- `marginMode` and `marginCoin` must be on every order
- For `USDT-FUTURES`: `marginCoin=USDT`; for `COIN-FUTURES`: `marginCoin` = base coin (e.g., `BTC`)
- **Do NOT mix `tradeSide` and `reduceOnly`** — use one or the other depending on position mode
- `tradeSide` is only valid in hedge mode; using it in one-way mode causes parameter errors
- `reduceOnly` is only valid in one-way mode; in hedge mode use `tradeSide=close`
- Preset TP/SL prices trigger against **mark price**, not last trade price
- There is no `futures_place_plan_order` in bgc — use presets or manual limit orders with `reduceOnly`
- In one-way mode, multiple `reduceOnly` orders are allowed; they auto-cancel if combined size exceeds position
- Set leverage before trading: `bgc futures futures_set_leverage ...`

---

## Official Docs
- Futures Place Order: https://www.bitget.com/api-doc/contract/trade/Place-Order
- Futures Batch Orders: https://www.bitget.com/api-doc/contract/trade/Batch-Place-Orders
