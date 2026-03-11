# spot_place_order — Spot Place Order

## Official Description
Place one or more spot orders. Executes real trades against the live order book.

**Endpoint:** `POST /api/v2/spot/trade/place-order` (single) | `POST /api/v2/spot/trade/batch-orders` (batch)
**Auth required:** Yes
**Rate limit:** 10 req/s per UID (1 req/s for copy-trading traders); batch: 5 req/s

---

## bgc CLI Usage

```bash
bgc spot spot_place_order --orders '<JSON array>'
```

The `--orders` parameter always takes a **JSON array**, even for a single order.

---

## Order Object Parameters

| Parameter | Type | Required | Allowed Values | Description |
|-----------|------|----------|----------------|-------------|
| `symbol` | string | Yes | e.g. `BTCUSDT` | Trading pair (uppercase) |
| `side` | string | Yes | `buy`, `sell` | Order direction |
| `orderType` | string | Yes | `limit`, `market` | Order type |
| `force` | string | Yes* | `gtc`, `post_only`, `fok`, `ioc` | Time-in-force. *Ignored for market orders |
| `price` | string | Conditional | e.g. `"65000"` | Required for limit orders |
| `size` | string | Yes | e.g. `"0.01"` | **Limit/market-sell**: base coin qty. **Market-buy**: quote coin qty |
| `clientOid` | string | No | e.g. `"my-order-001"` | Custom order ID for deduplication/tracking |
| `tpslType` | string | No | `normal` (default), `tpsl` | TP/SL mode. `tpsl` makes a standalone TP/SL order |
| `triggerPrice` | string | Conditional | e.g. `"66000"` | Required only when `tpslType=tpsl` |
| `presetTakeProfitPrice` | string | No | e.g. `"70000"` | TP trigger price (incompatible with `tpslType=tpsl`) |
| `executeTakeProfitPrice` | string | No | e.g. `"69900"` | TP execution price (incompatible with `tpslType=tpsl`) |
| `presetStopLossPrice` | string | No | e.g. `"60000"` | SL trigger price (incompatible with `tpslType=tpsl`) |
| `executeStopLossPrice` | string | No | e.g. `"59900"` | SL execution price (incompatible with `tpslType=tpsl`) |
| `stpMode` | string | No | `none`, `cancel_taker`, `cancel_maker`, `cancel_both` | Self-trade prevention |

### `force` Values Explained
| Value | Behavior |
|-------|----------|
| `gtc` | Good Till Cancelled — stays open until filled or manually cancelled |
| `post_only` | Maker-only — rejected if it would match immediately |
| `fok` | Fill or Kill — must fill entirely at once, or cancelled |
| `ioc` | Immediate or Cancel — fills what it can instantly, cancels remainder |

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | Exchange-assigned order ID |
| `clientOid` | string | Your custom ID (echoed back) |

---

## Usage Cases

### Case 1: Simple limit buy
```bash
bgc spot spot_place_order --orders '[{
  "symbol": "BTCUSDT",
  "side": "buy",
  "orderType": "limit",
  "force": "gtc",
  "price": "65000",
  "size": "0.01"
}]'
```
> Buy 0.01 BTC at $65,000. Order stays open until filled or cancelled.

### Case 2: Market buy (quote amount)
```bash
bgc spot spot_place_order --orders '[{
  "symbol": "BTCUSDT",
  "side": "buy",
  "orderType": "market",
  "force": "gtc",
  "size": "100"
}]'
```
> Spend exactly 100 USDT to buy BTC at market price. `size` is in quote coin (USDT) for market buys.

### Case 3: Market sell (base amount)
```bash
bgc spot spot_place_order --orders '[{
  "symbol": "BTCUSDT",
  "side": "sell",
  "orderType": "market",
  "force": "gtc",
  "size": "0.005"
}]'
```
> Sell 0.005 BTC at market price. `size` is in base coin (BTC) for sells.

### Case 4: Limit order with preset TP/SL
```bash
bgc spot spot_place_order --orders '[{
  "symbol": "ETHUSDT",
  "side": "buy",
  "orderType": "limit",
  "force": "gtc",
  "price": "3200",
  "size": "1",
  "presetTakeProfitPrice": "3800",
  "presetStopLossPrice": "2900"
}]'
```
> Buy 1 ETH at $3,200 with automatic TP at $3,800 and SL at $2,900.

### Case 5: Post-only maker order
```bash
bgc spot spot_place_order --orders '[{
  "symbol": "BTCUSDT",
  "side": "buy",
  "orderType": "limit",
  "force": "post_only",
  "price": "64500",
  "size": "0.01"
}]'
```
> Ensures you only pay maker fees. Rejected if the price would match immediately.

### Case 6: Batch — multiple orders at once
```bash
bgc spot spot_place_order --orders '[
  {"symbol":"BTCUSDT","side":"buy","orderType":"limit","force":"gtc","price":"64000","size":"0.01"},
  {"symbol":"BTCUSDT","side":"buy","orderType":"limit","force":"gtc","price":"63000","size":"0.02"},
  {"symbol":"ETHUSDT","side":"buy","orderType":"limit","force":"gtc","price":"3100","size":"0.5"}
]'
```
> Place a DCA ladder of buy orders in one call. Max 50 orders per batch.

### Case 7: Custom client order ID (deduplication)
```bash
bgc spot spot_place_order --orders '[{
  "symbol": "BTCUSDT",
  "side": "buy",
  "orderType": "limit",
  "force": "gtc",
  "price": "65000",
  "size": "0.01",
  "clientOid": "my-strategy-001"
}]'
```
> Use `clientOid` to track orders by your own ID and prevent duplicate submissions.

---

## Important Notes

- **`size` semantics flip** by order type and side:
  - Limit buy/sell, market sell → `size` = base coin (e.g., BTC)
  - Market buy → `size` = quote coin (e.g., USDT)
- **`tpslType=tpsl`** creates a standalone TP/SL order; cannot use `presetTakeProfitPrice` etc. simultaneously
- Get decimal precision (minSize, priceScale) via: `bgc spot spot_get_symbols --symbol BTCUSDT`
- Batch responses include both `successList` and `failureList` — partial success is possible

---

## Official Docs
- Spot Place Order: https://www.bitget.com/api-doc/spot/trade/Place-Order
- Spot Batch Orders: https://www.bitget.com/api-doc/spot/trade/Batch-Place-Orders
