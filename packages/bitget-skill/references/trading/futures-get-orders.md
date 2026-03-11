# futures_get_orders — Futures Query Orders

## Official Description
Query futures orders: a specific order by ID, all open (unfilled) orders, or historical orders. Also supports querying fill records.

**Endpoints:**
- Order detail: `GET /api/v2/mix/order/detail`
- Open orders: `GET /api/v2/mix/order/orders-pending`
- History orders: `GET /api/v2/mix/order/orders-history`
- Fills: `GET /api/v2/mix/order/fill-history`

**Auth required:** Yes
**Rate limit:** 10 req/s per UID

---

## bgc CLI Usage

```bash
bgc futures futures_get_orders \
  --productType <PRODUCT_TYPE> \
  [--orderId <id>] \
  [--symbol <SYMBOL>] \
  [--status open|history] \
  [--startTime <ms>] \
  [--endTime <ms>] \
  [--limit <n>]
```

---

## Parameters

| Parameter | Type | Required | Allowed Values | Description |
|-----------|------|----------|----------------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `COIN-FUTURES`, `USDC-FUTURES` | Contract type (required always) |
| `orderId` | string | No | e.g. `"1234567890"` | Fetch a specific order by exchange ID |
| `symbol` | string | No | e.g. `BTCUSDT` | Filter by contract symbol |
| `status` | string | No | `open` (default), `history` | `open` = pending; `history` = filled/cancelled |
| `startTime` | string | No | Unix ms | History start time |
| `endTime` | string | No | Unix ms | History end time |
| `limit` | number | No | 1–100, default 100 | Number of results |

---

## Key Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | Exchange order ID |
| `clientOid` | string | Custom order ID |
| `symbol` | string | Contract pair |
| `side` | string | `buy` or `sell` |
| `tradeSide` | string | `open`, `close`, `burst_close_long`, etc. |
| `orderType` | string | `limit` or `market` |
| `state` | string | `live`, `partially_filled`, `filled`, `canceled` |
| `price` | string | Order price |
| `priceAvg` | string | Average execution price |
| `size` | string | Order size (base coin) |
| `baseVolume` | string | Filled amount in base coin |
| `quoteVolume` | string | Filled amount in quote coin |
| `leverage` | string | Leverage at order time |
| `marginMode` | string | `isolated` or `crossed` |
| `marginCoin` | string | Collateral coin |
| `posSide` | string | `long`, `short`, or `net` |
| `posMode` | string | `one_way_mode` or `hedge_mode` |
| `reduceOnly` | string | `YES` or `NO` |
| `totalProfits` | string | Realized PnL |
| `fee` | string | Fee charged |
| `presetStopSurplusPrice` | string | TP trigger price |
| `presetStopLossPrice` | string | SL trigger price |
| `cancelReason` | string | `normal_cancel` or `stp_cancel` |
| `cTime` | string | Created timestamp (ms) |
| `uTime` | string | Last updated timestamp (ms) |

---

## Usage Cases

### Case 1: All open futures orders across all symbols
```bash
bgc futures futures_get_orders --productType USDT-FUTURES --status open
```

### Case 2: Open orders for a specific contract
```bash
bgc futures futures_get_orders --productType USDT-FUTURES --symbol BTCUSDT --status open
```

### Case 3: Fetch specific order details
```bash
bgc futures futures_get_orders --productType USDT-FUTURES --orderId "1234567890"
```
> Verify fill status, executed price, and PnL after placing an order.

### Case 4: View recent trade history
```bash
bgc futures futures_get_orders \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --status history \
  --limit 20
```

### Case 5: History in a time range (e.g., today)
```bash
bgc futures futures_get_orders \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --status history \
  --startTime "1700000000000" \
  --endTime "1700086400000"
```

### Case 6: Check order was filled before acting on it
```bash
bgc futures futures_get_orders --productType USDT-FUTURES --orderId "1234567890"
# Check "state": "filled" in response before proceeding
```

### Case 7: Get fill details (execution prices per fill)
```bash
bgc futures futures_get_fills --productType USDT-FUTURES --symbol BTCUSDT --orderId "1234567890"
```
> For individual fill records with exact execution prices, use `futures_get_fills`.

---

## tradeSide Values Reference

| Value | Description |
|-------|-------------|
| `open` | Opening a position |
| `close` | Closing a position |
| `burst_close_long` | Liquidation of long |
| `burst_close_short` | Liquidation of short |
| `delivery_close_long` | Delivery settlement long |
| `delivery_close_short` | Delivery settlement short |

---

## Important Notes

- `productType` is **always required** even for single-order lookup
- `startTime`/`endTime` only apply to `status=history`
- `state=partially_filled` means the order is still open with partial fill
- For TP/SL order history, check `orderSource` field for `profit_limit` type orders
- PnL in `totalProfits` is for closed/partially-closed orders only

---

## Official Docs
- Order Detail: https://www.bitget.com/api-doc/contract/trade/Get-Order-Details
- Open Orders: https://www.bitget.com/api-doc/contract/trade/Get-Unfilled-Orders
- History Orders: https://www.bitget.com/api-doc/contract/trade/Get-History-Orders
