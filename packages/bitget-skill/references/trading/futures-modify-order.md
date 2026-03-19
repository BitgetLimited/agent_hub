# futures_modify_order — Futures Modify Order

## Official Description
Modify a pending futures order. Can update TP/SL trigger prices, limit price, and size.

**Key behavior difference:**
- Modifying **only TP/SL** (`newPresetStopSurplusPrice` / `newPresetStopLossPrice`): **does NOT cancel the original order** — in-place update
- Modifying **size/price** (`newSize` + `newPrice`): **cancels and recreates** the order with a new `orderId`

**Endpoint:** `POST /api/v2/mix/order/modify-order`
**Auth required:** Yes
**Rate limit:** 10 req/s per UID

---

## bgc CLI Usage

```bash
bgc futures futures_modify_order \
  --symbol BTCUSDT \
  --productType USDT-FUTURES \
  --marginCoin USDT \
  --orderId <id> \
  --newClientOid <new-client-id> \
  [--newPresetStopSurplusPrice <price>] \
  [--newPresetStopLossPrice <price>] \
  [--newSize <size> --newPrice <price>]
```

---

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair, e.g. `BTCUSDT` |
| `productType` | string | Yes | `USDT-FUTURES`, `COIN-FUTURES`, or `USDC-FUTURES` |
| `marginCoin` | string | Yes | Margin asset, e.g. `USDT` |
| `orderId` | string | Conditional* | Exchange order ID |
| `clientOid` | string | Conditional* | Custom order ID. `orderId` takes priority if both given |
| `newClientOid` | string | Yes | New custom order ID for the modified order |
| `newSize` | string | No | New order quantity. **Must be provided with `newPrice`** |
| `newPrice` | string | No | New limit price. **Must be provided with `newSize`** |
| `newPresetStopSurplusPrice` | string | No | New take-profit trigger price. Pass `"0"` to delete |
| `newPresetStopLossPrice` | string | No | New stop-loss trigger price. Pass `"0"` to delete |

*One of `orderId` or `clientOid` must be provided.
At least one modification field must be present.

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | New order ID (only changes when size/price modified) |
| `clientOid` | string | New custom order ID |

---

## Usage Cases

### Case 1: Add TP/SL to an existing pending order

You placed a limit order without TP/SL. Now you want to add them without cancelling the order:

```bash
bgc futures futures_modify_order \
  --symbol BTCUSDT \
  --productType USDT-FUTURES \
  --marginCoin USDT \
  --orderId "1234567890" \
  --newClientOid "my-order-v2" \
  --newPresetStopSurplusPrice "72000" \
  --newPresetStopLossPrice "61000"
```
> The original order stays active. Only the TP/SL triggers are updated.

### Case 2: Adjust existing TP price only

```bash
bgc futures futures_modify_order \
  --symbol BTCUSDT \
  --productType USDT-FUTURES \
  --marginCoin USDT \
  --orderId "1234567890" \
  --newClientOid "my-order-v3" \
  --newPresetStopSurplusPrice "75000"
```
> Move TP target without touching SL or the order itself.

### Case 3: Delete TP/SL (pass "0")

```bash
bgc futures futures_modify_order \
  --symbol BTCUSDT \
  --productType USDT-FUTURES \
  --marginCoin USDT \
  --orderId "1234567890" \
  --newClientOid "my-order-v4" \
  --newPresetStopSurplusPrice "0" \
  --newPresetStopLossPrice "0"
```
> Removes both TP and SL presets from the order.

### Case 4: Reprice a limit order (cancel-and-replace)

```bash
bgc futures futures_modify_order \
  --symbol BTCUSDT \
  --productType USDT-FUTURES \
  --marginCoin USDT \
  --orderId "1234567890" \
  --newClientOid "my-order-v5" \
  --newPrice "64500" \
  --newSize "0.01"
```
> ⚠️ This cancels the original order and creates a new one. Save the new `orderId` from response.

### Case 5: Reprice and update TP/SL together

```bash
bgc futures futures_modify_order \
  --symbol BTCUSDT \
  --productType USDT-FUTURES \
  --marginCoin USDT \
  --orderId "1234567890" \
  --newClientOid "my-order-v6" \
  --newPrice "64500" \
  --newSize "0.01" \
  --newPresetStopSurplusPrice "71000" \
  --newPresetStopLossPrice "60000"
```

---

## Important Notes

- Only **pending limit orders** can be modified — filled or partially filled orders cannot
- `newSize` and `newPrice` must always be provided **together** — you cannot change only one
- TP/SL-only modifications do **not** change the `orderId`; size/price changes produce a **new `orderId`**
- TP/SL trigger prices are evaluated against **mark price**, not last trade price
- After a size/price modification, the original `orderId` is invalidated — update any references

---

## Workflow: Open order + set TP/SL after the fact

```bash
# Step 1: Place a limit buy
bgc futures futures_place_order --orders '[{
  "symbol": "BTCUSDT", "productType": "USDT-FUTURES",
  "marginMode": "crossed", "marginCoin": "USDT",
  "side": "buy", "orderType": "limit", "force": "gtc",
  "price": "65000", "size": "0.01"
}]'
# → save the returned orderId, e.g. "1234567890"

# Step 2: Add TP/SL without cancelling the order
bgc futures futures_modify_order \
  --symbol BTCUSDT \
  --productType USDT-FUTURES \
  --marginCoin USDT \
  --orderId "1234567890" \
  --newClientOid "my-entry-v2" \
  --newPresetStopSurplusPrice "72000" \
  --newPresetStopLossPrice "61000"
```

---

## Official Docs
- Modify Order: https://www.bitget.com/api-doc/contract/trade/Modify-Order
