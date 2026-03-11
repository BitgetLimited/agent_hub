# spot_place_plan_order / spot_get_plan_orders / spot_cancel_plan_orders — Spot Trigger Orders

## Official Description
Spot trigger (plan) orders are conditional orders that activate when the market price reaches a specified trigger price. Once triggered, the system places either a limit or market order on your behalf.

**Endpoints:**
- Place: `POST /api/v2/spot/trade/place-plan-order`
- Modify: `POST /api/v2/spot/trade/modify-plan-order`
- Cancel: `POST /api/v2/spot/trade/cancel-plan-order`
- Get current: `GET /api/v2/spot/trade/current-plan-order`
- Get history: `GET /api/v2/spot/trade/history-plan-order`

**Auth required:** Yes
**Rate limit:** Place/modify: 20 req/s per UID

---

## Place Plan Order Parameters

| Parameter | Type | Required | Allowed Values | Description |
|-----------|------|----------|----------------|-------------|
| `symbol` | string | Yes | e.g. `BTCUSDT` | Trading pair |
| `side` | string | Yes | `buy`, `sell` | Order direction |
| `triggerPrice` | string | Yes | e.g. `"68000"` | Price that activates this order |
| `triggerType` | string | Yes | `fill_price`, `mark_price` | Which price feed to watch |
| `orderType` | string | Yes | `limit`, `market` | Execution order type once triggered |
| `price` | string | Conditional | e.g. `"68100"` | Execution price. Required when `orderType=limit` |
| `size` | string | Yes | e.g. `"0.01"` | Order quantity |
| `planType` | string | No | `amount` (default), `total` | `amount` = base coin; `total` = quote coin |
| `clientOid` | string | No | e.g. `"trigger-001"` | Custom ID for tracking |
| `stpMode` | string | No | `none`, `cancel_taker`, `cancel_maker`, `cancel_both` | Self-trade prevention |

### `triggerType` Values
| Value | Description |
|-------|-------------|
| `fill_price` | Triggers based on last traded price |
| `mark_price` | Triggers based on mark price (more resistant to manipulation) |

---

## Get Plan Orders Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair |
| `status` | string | No | `current` (default) = pending triggers; `history` = triggered/cancelled |
| `startTime` | string | No | Unix ms (history only) |
| `endTime` | string | No | Unix ms (history only) |
| `limit` | number | No | Default 100 |

---

## Cancel Plan Orders Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string | No | Cancel single plan order |
| `orderIds` | array | No | Cancel multiple plan orders |
| `symbol` | string | No | Cancel ALL plan orders for symbol |

---

## Usage Cases

### Case 1: Breakout buy — buy when price breaks above resistance
```bash
bgc spot spot_place_plan_order \
  --triggerPrice "70000" \
  --symbol BTCUSDT \
  --side buy \
  --triggerType fill_price \
  --orderType limit \
  --price "70100" \
  --size "0.01"
```
> Triggers when BTC hits $70,000. Places a limit buy at $70,100 (slight buffer to ensure fill).

### Case 2: Stop-loss — sell if price drops below support
```bash
bgc spot spot_place_plan_order \
  --triggerPrice "60000" \
  --symbol BTCUSDT \
  --side sell \
  --triggerType fill_price \
  --orderType market \
  --size "0.01"
```
> If BTC falls to $60,000, immediately market-sell 0.01 BTC to cut losses.

### Case 3: Take-profit limit sell
```bash
bgc spot spot_place_plan_order \
  --triggerPrice "75000" \
  --symbol BTCUSDT \
  --side sell \
  --triggerType fill_price \
  --orderType limit \
  --price "74900" \
  --size "0.01"
```
> When BTC reaches $75,000, place a limit sell at $74,900.

### Case 4: Buy the dip — conditional buy at lower price
```bash
bgc spot spot_place_plan_order \
  --triggerPrice "58000" \
  --symbol BTCUSDT \
  --side buy \
  --triggerType fill_price \
  --orderType limit \
  --price "57900" \
  --size "0.02"
```
> Wait for a dip to $58,000, then buy at $57,900.

### Case 5: View all pending trigger orders
```bash
bgc spot spot_get_plan_orders --symbol BTCUSDT --status current
```

### Case 6: Cancel a specific plan order
```bash
bgc spot spot_cancel_plan_orders --orderId "plan-order-id-here"
```

### Case 7: Cancel all plan orders for a symbol
```bash
bgc spot spot_cancel_plan_orders --symbol BTCUSDT
```

### Case 8: Modify an existing plan order
```bash
# Use spot_place_plan_order with --orderId to modify
bgc spot spot_place_plan_order \
  --orderId "existing-plan-order-id" \
  --triggerPrice "71000" \
  --symbol BTCUSDT \
  --side buy \
  --triggerType fill_price \
  --orderType limit \
  --price "71100" \
  --size "0.01"
```
> Pass `--orderId` to modify an existing plan order instead of creating a new one.

---

## Important Notes

- Plan orders are **pending** until triggered — they show under `status=current`
- After triggering, they move to `status=history` (with execution result)
- `mark_price` triggers are harder to manipulate via wash trading — prefer for stop-losses
- `planType=total` lets you specify spend amount in quote coin (e.g., spend 1000 USDT)
- Plan orders do **not** reserve margin/balance — ensure funds are available at trigger time

---

## Official Docs
- Place Plan Order: https://www.bitget.com/api-doc/spot/plan/Place-Plan-Order
- Current Plan Orders: https://www.bitget.com/api-doc/spot/plan/Get-Current-Plan-Orders
