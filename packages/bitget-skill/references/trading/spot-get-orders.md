# spot_get_orders — Spot Query Orders

## Official Description
Query spot order details: a single order by ID, current open orders, or historical filled/cancelled orders. Supports time-range filtering and cursor-based pagination.

**Endpoints:**
- Single order: `GET /api/v2/spot/trade/orderInfo`
- Open orders: `GET /api/v2/spot/trade/unfilled-orders`
- History orders: `GET /api/v2/spot/trade/history-orders`

**Auth required:** Yes
**Rate limit:** 10 req/s per UID

---

## bgc CLI Usage

```bash
bgc spot spot_get_orders [--orderId <id>] [--symbol <SYMBOL>] [--status open|history] [--startTime <ms>] [--endTime <ms>] [--limit <n>] [--idLessThan <id>]
```

---

## Parameters

| Parameter | Type | Required | Allowed Values | Description |
|-----------|------|----------|----------------|-------------|
| `orderId` | string | No | e.g. `"1234567890"` | Fetch a specific order. Returns single result |
| `symbol` | string | No | e.g. `BTCUSDT` | Filter by trading pair |
| `status` | string | No | `open` (default), `history` | `open` = unfilled orders; `history` = filled/cancelled |
| `startTime` | string | No | Unix ms, e.g. `"1700000000000"` | Start of time range (history only) |
| `endTime` | string | No | Unix ms | End of time range (history only) |
| `limit` | number | No | 1–100, default 100 | Number of results to return |
| `idLessThan` | string | No | orderId cursor | Pagination: return orders with ID less than this value |

---

## Key Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | Exchange order ID |
| `clientOid` | string | Your custom order ID |
| `symbol` | string | Trading pair |
| `side` | string | `buy` or `sell` |
| `orderType` | string | `limit` or `market` |
| `status` | string | `live`, `partially_filled`, `filled`, `cancelled` |
| `price` | string | Limit price |
| `priceAvg` | string | Average fill price |
| `size` | string | Original order size |
| `fillSize` | string | Amount filled so far |
| `fillAmount` | string | Quote amount filled |
| `fee` | string | Transaction fee paid |
| `force` | string | `gtc`, `ioc`, `fok`, `post_only` |
| `cTime` | string | Created timestamp (ms) |
| `uTime` | string | Last updated timestamp (ms) |

---

## Usage Cases

### Case 1: View all open orders
```bash
bgc spot spot_get_orders --status open
```
> Show all currently open orders across all symbols.

### Case 2: Open orders for a specific symbol
```bash
bgc spot spot_get_orders --symbol BTCUSDT --status open
```
> Show only BTCUSDT open orders.

### Case 3: Fetch a specific order by ID
```bash
bgc spot spot_get_orders --orderId "1234567890"
```
> Get full details of one order — useful to check fill status after placing.

### Case 4: Recent trade history for a symbol
```bash
bgc spot spot_get_orders --symbol ETHUSDT --status history --limit 20
```
> Show last 20 completed/cancelled orders for ETHUSDT.

### Case 5: History within a time range
```bash
bgc spot spot_get_orders \
  --symbol BTCUSDT \
  --status history \
  --startTime "1700000000000" \
  --endTime "1700086400000"
```
> Fetch orders executed within a specific date range. Convert dates to Unix ms timestamps.

### Case 6: Paginate through large history
```bash
# First page
bgc spot spot_get_orders --symbol BTCUSDT --status history --limit 100

# Next page — use the smallest orderId from previous response
bgc spot spot_get_orders --symbol BTCUSDT --status history --limit 100 --idLessThan "1234500000"
```
> Use `idLessThan` cursor to paginate backwards through history.

---

## Important Notes

- Default `status` is `open` — always specify `--status history` for filled/cancelled orders
- `startTime`/`endTime` only apply to `status=history`
- For fill details (price per fill, fee per fill): use `spot_get_fills` instead
- To get Unix ms for a date: `date -d "2024-01-01" +%s000` (Linux) or use an online converter

---

## Official Docs
- Unfilled Orders: https://www.bitget.com/api-doc/spot/trade/Get-Unfilled-Orders
- History Orders: https://www.bitget.com/api-doc/spot/trade/Get-History-Orders
- Order Detail: https://www.bitget.com/api-doc/spot/trade/Get-Order-Details
