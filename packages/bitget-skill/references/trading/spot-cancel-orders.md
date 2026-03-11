# spot_cancel_orders — Spot Cancel Orders

## Official Description
Cancel one or more open spot orders by order ID, batch of IDs, or cancel all open orders for a symbol.

**Endpoint:** `POST /api/v2/spot/trade/cancel-order` (single) | `POST /api/v2/spot/trade/batch-cancel-order` (batch) | `POST /api/v2/spot/trade/cancel-symbol-order` (cancel-all)
**Auth required:** Yes
**Rate limit:** 10 req/s per UID

---

## bgc CLI Usage

```bash
bgc spot spot_cancel_orders --symbol <SYMBOL> [--orderId <id> | --orderIds '[...]' | --cancelAll true]
```

---

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair, e.g. `BTCUSDT` |
| `orderId` | string | No | Cancel a single order by exchange order ID |
| `orderIds` | array | No | Cancel up to 50 orders by ID list |
| `cancelAll` | boolean | No | If `true`, cancel ALL open orders for the symbol |

> Exactly one of `orderId`, `orderIds`, or `cancelAll` should be used per call.

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | Cancelled order ID |
| `clientOid` | string | Custom order ID if set |

For batch cancels, response includes `successList` and `failureList`.

---

## Usage Cases

### Case 1: Cancel a single order
```bash
bgc spot spot_cancel_orders --symbol BTCUSDT --orderId "1234567890"
```
> Cancel one specific open order.

### Case 2: Cancel multiple specific orders
```bash
bgc spot spot_cancel_orders --symbol BTCUSDT --orderIds '["1234567890","9876543210","1122334455"]'
```
> Cancel up to 50 orders in one API call. Useful for clearing a DCA ladder.

### Case 3: Cancel ALL open orders for a symbol
```bash
bgc spot spot_cancel_orders --symbol BTCUSDT --cancelAll true
```
> Wipe all open orders on BTCUSDT at once. Use before a major position change or in emergency exit.

### Case 4: Cancel by clientOid (look up orderId first)
```bash
# Step 1: find the orderId
bgc spot spot_get_orders --symbol BTCUSDT --status open

# Step 2: cancel it
bgc spot spot_cancel_orders --symbol BTCUSDT --orderId "<found-orderId>"
```
> The cancel endpoint requires the exchange `orderId`. If you only have `clientOid`, query orders first.

---

## Important Notes

- Cancelling an already-filled or cancelled order returns an error — check order status first if unsure
- `cancelAll` is the fastest way to exit all open orders on a symbol in a single call
- Batch cancel response includes `failureList` — partial cancellations are possible
- For plan/trigger orders use `spot_cancel_plan_orders` instead

---

## Official Docs
- Cancel Order: https://www.bitget.com/api-doc/spot/trade/Cancel-Order
- Batch Cancel: https://www.bitget.com/api-doc/spot/trade/Batch-Cancel-Orders
