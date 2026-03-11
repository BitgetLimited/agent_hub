# futures_cancel_orders — Futures Cancel Orders

## Official Description
Cancel one or more open futures orders by order ID, batch of IDs, or cancel all open orders for a contract.

**Endpoint:** `POST /api/v2/mix/order/cancel-order` (single) | `POST /api/v2/mix/order/batch-cancel-orders` (batch) | `POST /api/v2/mix/order/cancel-all-orders` (cancel-all)
**Auth required:** Yes
**Rate limit:** 10 req/s per UID

---

## bgc CLI Usage

```bash
bgc futures futures_cancel_orders \
  --productType <PRODUCT_TYPE> \
  --symbol <SYMBOL> \
  [--orderId <id> | --orderIds '[...]' | --cancelAll true] \
  [--marginCoin <coin>]
```

---

## Parameters

| Parameter | Type | Required | Allowed Values | Description |
|-----------|------|----------|----------------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `COIN-FUTURES`, `USDC-FUTURES` | Contract type |
| `symbol` | string | Yes | e.g. `BTCUSDT` | Contract symbol |
| `orderId` | string | No | e.g. `"1234567890"` | Cancel a single order |
| `orderIds` | array | No | e.g. `["id1","id2"]` | Cancel up to 50 orders |
| `cancelAll` | boolean | No | `true` | Cancel ALL open orders for the symbol |
| `marginCoin` | string | No | e.g. `USDT` | Required for cancel-all on COIN-FUTURES |

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | Cancelled order ID |
| `clientOid` | string | Custom order ID if set |

Batch responses include `successList` and `failureList`.

---

## Usage Cases

### Case 1: Cancel a single futures order
```bash
bgc futures futures_cancel_orders \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --orderId "1234567890"
```

### Case 2: Cancel multiple specific orders
```bash
bgc futures futures_cancel_orders \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --orderIds '["1234567890","9876543210"]'
```

### Case 3: Cancel all open orders for a contract
```bash
bgc futures futures_cancel_orders \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --cancelAll true
```
> Emergency exit from all open limit orders on BTCUSDT futures.

### Case 4: Cancel all orders before modifying leverage
```bash
# Step 1: cancel all open orders (required before leverage change if orders exist)
bgc futures futures_cancel_orders \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --cancelAll true

# Step 2: update leverage
bgc futures futures_set_leverage \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --marginCoin USDT \
  --leverage 20
```

### Case 5: Cancel COIN-FUTURES orders
```bash
bgc futures futures_cancel_orders \
  --productType COIN-FUTURES \
  --symbol BTCUSD \
  --marginCoin BTC \
  --cancelAll true
```

---

## Important Notes

- Cancelling an already-filled or expired order will return an error
- For TP/SL orders (TPSL type): use a dedicated TPSL cancel endpoint — regular cancel may not work
- `marginCoin` is required when using `cancelAll` on COIN-FUTURES contracts
- After cancelling orders, verify with: `bgc futures futures_get_orders --productType USDT-FUTURES --status open`

---

## Official Docs
- Cancel Order: https://www.bitget.com/api-doc/contract/trade/Cancel-Order
- Batch Cancel: https://www.bitget.com/api-doc/contract/trade/Batch-Cancel-Orders
