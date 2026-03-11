# spot_modify_order — Spot Modify Order

## Official Description
Atomically cancel an existing open spot order and replace it with a new one (modify price and/or size). This is a cancel-and-replace operation — the original order is cancelled and a new order ID is returned.

**Endpoint:** `POST /api/v2/spot/trade/modify-order`
**Auth required:** Yes
**Rate limit:** 10 req/s per UID

---

## bgc CLI Usage

```bash
bgc spot spot_modify_order --symbol <SYMBOL> --orderId <id> [--newPrice <price>] [--newSize <size>] [--newClientOid <id>]
```

---

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair, e.g. `BTCUSDT` |
| `orderId` | string | Yes | Original order ID to modify |
| `newPrice` | string | No | New limit price. Omit to keep original price |
| `newSize` | string | No | New order quantity. Omit to keep original size |
| `newClientOid` | string | No | New custom order ID for the replacement order |

> At least one of `newPrice` or `newSize` should be provided, otherwise the operation has no effect.

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | New order ID (the replacement order) |
| `clientOid` | string | New custom order ID (echoed back) |

---

## Usage Cases

### Case 1: Chase the market — update price only
```bash
bgc spot spot_modify_order \
  --symbol BTCUSDT \
  --orderId "1234567890" \
  --newPrice "64800"
```
> Move your limit buy closer to current price without losing queue priority advantage vs. a manual cancel+repost.

### Case 2: Adjust order size only
```bash
bgc spot spot_modify_order \
  --symbol BTCUSDT \
  --orderId "1234567890" \
  --newSize "0.02"
```
> Increase or decrease the quantity of an existing limit order.

### Case 3: Modify both price and size
```bash
bgc spot spot_modify_order \
  --symbol ETHUSDT \
  --orderId "9876543210" \
  --newPrice "3150" \
  --newSize "2"
```
> Fully reprice and resize in one atomic call.

### Case 4: Reassign clientOid on the replacement
```bash
bgc spot spot_modify_order \
  --symbol BTCUSDT \
  --orderId "1234567890" \
  --newPrice "64900" \
  --newClientOid "my-strategy-v2-001"
```
> Update your own tracking ID along with the price adjustment.

---

## Important Notes

- This is a **cancel-and-replace** — the original `orderId` is invalidated; save the new `orderId` from the response
- Only works on **open (unfilled) limit orders** — market orders cannot be modified
- If the order fills between your modify request and server processing, the operation may fail
- Query current orders first to confirm the order is still open: `bgc spot spot_get_orders --symbol BTCUSDT --status open`

---

## Official Docs
- Modify Order: https://www.bitget.com/api-doc/spot/trade/Modify-Order
