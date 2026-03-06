# Bitget MCP Server - Tools Reference

> Version: 1.0.0-draft
> Total tools: 57 (34 default + 23 optional modules)

## Table of Contents

- [Module: spot (12 tools, default)](#module-spot)
- [Module: futures (14 tools, default)](#module-futures)
- [Module: account (8 tools, default)](#module-account)
- [Module: margin (7 tools, optional)](#module-margin)
- [Module: copytrading (5 tools, optional)](#module-copytrading)
- [Module: convert (3 tools, optional)](#module-convert)
- [Module: earn (3 tools, optional)](#module-earn)
- [Module: p2p (2 tools, optional)](#module-p2p)
- [Module: broker (3 tools, optional)](#module-broker)

---

## Conventions

- **Auth**: `Public` = no API key needed, `Private` = requires API key
- **Risk**: `[READ]` = query only, `[WRITE]` = modifies state, `[DANGER]` = irreversible / funds movement
- **Rate limit**: expressed as `{count} req/{interval} per {scope}` (e.g. `10 req/1s per UID`)
- **Parameter types**: use JSON Schema types; amounts/prices always `string` to avoid float precision issues

---

<a id="module-spot"></a>
## Module: spot (12 tools)

Default loaded. Covers spot market data and spot trading.

---

### spot_get_ticker

> Get real-time ticker data for spot trading pair(s). Returns last price, 24h high/low, 24h volume, bid/ask.

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 20 req/1s per IP |
| Bitget API | `GET /api/v2/spot/market/tickers` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | No | Trading pair, e.g. `BTCUSDT`. If omitted, returns all tickers. |

**Response fields:** `symbol`, `lastPr` (last price), `high24h`, `low24h`, `quoteVolume` (24h volume in quote), `baseVolume` (24h volume in base), `askPr`, `bidPr`, `ts`

---

### spot_get_depth

> Get orderbook depth for a spot trading pair. Supports merged depth levels.

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 20 req/1s per IP |
| Bitget API | `GET /api/v2/spot/market/orderbook` or `GET /api/v2/spot/market/merge-depth` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair, e.g. `BTCUSDT` |
| `type` | string | No | `"step0"` (no merge, default), `"step1"`, `"step2"`, `"step3"`, `"step4"`, `"step5"` for different merge levels |
| `limit` | number | No | Number of depth levels. Default 150, max 150. Use 5 or 15 for quick overview. |

**Internal routing:** When `type` is `"step0"` or omitted → calls `orderbook`. Otherwise → calls `merge-depth`.

**Response fields:** `asks` (array of [price, size]), `bids` (array of [price, size]), `ts`

---

### spot_get_candles

> Get K-line / candlestick data for a spot trading pair. Supports current and historical data.

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 20 req/1s per IP |
| Bitget API | `GET /api/v2/spot/market/candles` or `GET /api/v2/spot/market/history-candles` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair, e.g. `BTCUSDT` |
| `granularity` | string | Yes | K-line period. Values: `1min`, `5min`, `15min`, `30min`, `1h`, `4h`, `6h`, `12h`, `1day`, `3day`, `1week`, `1M` |
| `startTime` | string | No | Start time in millisecond timestamp |
| `endTime` | string | No | End time in millisecond timestamp |
| `limit` | number | No | Number of candles. Default 100, max 1000. |

**Internal routing:** If `startTime` is provided and refers to data older than current candle range → calls `history-candles`. Otherwise → calls `candles`.

**Response fields:** Array of `[ts, open, high, low, close, baseVolume, quoteVolume]`

---

### spot_get_trades

> Get recent or historical trade records for a spot trading pair.

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 10 req/1s per IP |
| Bitget API | `GET /api/v2/spot/market/fills` or `GET /api/v2/spot/market/fills-history` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair, e.g. `BTCUSDT` |
| `limit` | number | No | Number of trades. Default 100, max 500. |
| `startTime` | string | No | Start time in millisecond timestamp. When provided, queries history. |
| `endTime` | string | No | End time in millisecond timestamp |

**Response fields:** `symbol`, `tradeId`, `side`, `price`, `size`, `ts`

---

### spot_get_symbols

> Get spot coin information and trading pair details (precision, min order size, status).

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 20 req/1s per IP |
| Bitget API | `GET /api/v2/spot/public/coins` and `GET /api/v2/spot/public/symbols` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | No | Filter by specific trading pair, e.g. `BTCUSDT` |
| `coin` | string | No | Filter by coin name, e.g. `BTC`. Returns coin chain/deposit/withdraw info. |
| `type` | string | No | `"symbols"` (default) returns trading pair info, `"coins"` returns coin chain info |

**Response fields (symbols):** `symbol`, `baseCoin`, `quoteCoin`, `minTradeAmount`, `maxTradeAmount`, `pricePrecision`, `quantityPrecision`, `status`

**Response fields (coins):** `coin`, `chains` (array with `chain`, `depositConfirm`, `withdrawConfirm`, `minDepositAmount`, `minWithdrawAmount`)

---

### spot_place_order

> Place one or more spot orders. Supports limit and market order types. [CAUTION] Executes real trades.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/spot/trade/place-order` or `POST /api/v2/spot/trade/batch-orders` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orders` | array | Yes | Array of order objects. Single order = array with 1 element. |
| `orders[].symbol` | string | Yes | Trading pair, e.g. `BTCUSDT` |
| `orders[].side` | string | Yes | `"buy"` or `"sell"` |
| `orders[].orderType` | string | Yes | `"limit"` or `"market"` |
| `orders[].price` | string | Conditional | Required for limit orders. Order price as string. |
| `orders[].size` | string | Yes | Order quantity as string |
| `orders[].clientOid` | string | No | Client-defined order ID for idempotency |
| `orders[].force` | string | No | Time in force: `"GTC"` (default), `"IOC"`, `"FOK"`, `"POST_ONLY"` |

**Internal routing:** `orders.length === 1` → calls `place-order`. `orders.length > 1` → calls `batch-orders` (max 50).

**Response fields:** `orderId`, `clientOid`

---

### spot_cancel_orders

> Cancel one or more spot orders. Supports cancel by order ID, batch IDs, or by trading pair.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/spot/trade/cancel-order` or `POST /api/v2/spot/trade/batch-cancel-order` or `POST /api/v2/spot/trade/cancel-symbol-order` |

**Parameters (one of three modes):**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair |
| `orderId` | string | No | Cancel single order by server order ID |
| `orderIds` | array | No | Cancel multiple orders by IDs (max 50) |
| `cancelAll` | boolean | No | If `true`, cancel all open orders for the symbol |

**Internal routing:** `orderId` → `cancel-order`. `orderIds` → `batch-cancel-order`. `cancelAll` → `cancel-symbol-order`.

**Response fields:** `orderId`, `clientOid`

---

### spot_modify_order

> Cancel an existing order and place a new one atomically.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/spot/trade/cancel-replace-order` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair |
| `orderId` | string | Yes | Original order ID to cancel |
| `newPrice` | string | No | New price (for limit orders) |
| `newSize` | string | No | New quantity |
| `newClientOid` | string | No | New client order ID |

**Response fields:** `orderId`, `clientOid`

---

### spot_get_orders

> Query spot orders: open orders, historical orders, or a specific order by ID.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/spot/trade/orderInfo` or `GET /api/v2/spot/trade/unfilled-orders` or `GET /api/v2/spot/trade/history-orders` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string | No | Query specific order by ID. If provided, other filters ignored. |
| `symbol` | string | No | Filter by trading pair |
| `status` | string | No | `"open"` (default) for unfilled orders, `"history"` for completed/cancelled |
| `startTime` | string | No | Start time filter (ms timestamp) |
| `endTime` | string | No | End time filter (ms timestamp) |
| `limit` | number | No | Number of results. Default 100, max 500. |
| `idLessThan` | string | No | Pagination: return orders with ID less than this |

**Internal routing:** `orderId` → `orderInfo`. `status="open"` → `unfilled-orders`. `status="history"` → `history-orders`.

**Response fields:** `orderId`, `clientOid`, `symbol`, `side`, `orderType`, `price`, `size`, `filledSize`, `filledAmount`, `status`, `cTime`, `uTime`

---

### spot_get_fills

> Get trade execution details (fills) for spot orders.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/spot/trade/fills` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair |
| `orderId` | string | No | Filter by order ID |
| `startTime` | string | No | Start time (ms timestamp) |
| `endTime` | string | No | End time (ms timestamp) |
| `limit` | number | No | Default 100, max 500 |

**Response fields:** `tradeId`, `orderId`, `symbol`, `side`, `price`, `size`, `fee`, `feeCoin`, `ts`

---

### spot_place_plan_order

> Create or modify a trigger (plan) order for spot trading. Order executes when trigger price is reached.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/spot/trade/place-plan-order` or `POST /api/v2/spot/trade/modify-plan-order` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string | No | If provided, modifies existing plan order. If omitted, creates new one. |
| `symbol` | string | Yes (create) | Trading pair |
| `side` | string | Yes (create) | `"buy"` or `"sell"` |
| `triggerPrice` | string | Yes | Price that triggers the order |
| `triggerType` | string | No | `"mark_price"`, `"last_price"` (default) |
| `orderType` | string | Yes (create) | `"limit"` or `"market"` |
| `price` | string | Conditional | Execution price for limit orders |
| `size` | string | Yes (create) | Order quantity |

**Internal routing:** `orderId` present → `modify-plan-order`. Otherwise → `place-plan-order`.

---

### spot_get_plan_orders

> Query current or historical plan (trigger) orders for spot trading.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/spot/trade/current-plan-order` or `GET /api/v2/spot/trade/history-plan-order` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair |
| `status` | string | No | `"current"` (default) for pending plan orders, `"history"` for triggered/cancelled |
| `startTime` | string | No | Start time (ms timestamp) |
| `endTime` | string | No | End time (ms timestamp) |
| `limit` | number | No | Default 100, max 500 |

---

### spot_cancel_plan_orders

> Cancel one or more pending plan (trigger) orders for spot trading.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/spot/trade/cancel-plan-order` or `POST /api/v2/spot/trade/batch-cancel-plan-order` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string | No | Cancel single plan order by ID |
| `orderIds` | array | No | Cancel multiple plan orders by IDs |
| `symbol` | string | No | Cancel all plan orders for this symbol (when neither orderId nor orderIds is provided) |

---

<a id="module-futures"></a>
## Module: futures (14 tools)

Default loaded. Covers futures (USDT-M, USDC-M, Coin-M) market data and trading.

All futures tools require a `productType` parameter: `"USDT-FUTURES"`, `"USDC-FUTURES"`, or `"COIN-FUTURES"`.

---

### futures_get_ticker

> Get real-time ticker data for futures contract(s).

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 20 req/1s per IP |
| Bitget API | `GET /api/v2/mix/market/ticker` or `GET /api/v2/mix/market/tickers` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `"USDT-FUTURES"`, `"USDC-FUTURES"`, or `"COIN-FUTURES"` |
| `symbol` | string | No | Contract symbol, e.g. `BTCUSDT`. If omitted, returns all tickers for the product type. |

---

### futures_get_depth

> Get orderbook depth for a futures contract. Supports merged depth levels.

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 20 req/1s per IP |
| Bitget API | `GET /api/v2/mix/market/merge-depth` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | Yes | Contract symbol |
| `limit` | number | No | Depth levels. Default 100, max 100. |
| `precision` | string | No | Merge precision, e.g. `"1"`, `"0.1"`, `"0.01"` |

---

### futures_get_candles

> Get K-line data for a futures contract. Supports current, historical, index price, and mark price candles.

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 20 req/1s per IP |
| Bitget API | `GET /api/v2/mix/market/candles` or `GET /api/v2/mix/market/history-candles` or `GET /api/v2/mix/market/history-index-candles` or `GET /api/v2/mix/market/history-mark-candles` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | Yes | Contract symbol |
| `granularity` | string | Yes | K-line period: `1min`, `5min`, `15min`, `30min`, `1h`, `4h`, `6h`, `12h`, `1day`, `3day`, `1week`, `1M` |
| `priceType` | string | No | `"trade"` (default), `"index"`, `"mark"` — selects price source |
| `startTime` | string | No | Start time (ms timestamp) |
| `endTime` | string | No | End time (ms timestamp) |
| `limit` | number | No | Default 100, max 1000 |

**Internal routing:** `priceType="index"` → `history-index-candles`. `priceType="mark"` → `history-mark-candles`. Default with old startTime → `history-candles`. Otherwise → `candles`.

---

### futures_get_trades

> Get recent or historical trade records for a futures contract.

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 10 req/1s per IP |
| Bitget API | `GET /api/v2/mix/market/fills` or `GET /api/v2/mix/market/fills-history` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | Yes | Contract symbol |
| `limit` | number | No | Default 100, max 500 |
| `startTime` | string | No | Start time (ms) |
| `endTime` | string | No | End time (ms) |

---

### futures_get_contracts

> Get contract configuration details (leverage range, tick size, maintenance margin, etc.).

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 20 req/1s per IP |
| Bitget API | `GET /api/v2/mix/market/contracts` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | No | Filter by specific contract |

---

### futures_get_funding_rate

> Get current and/or historical funding rates for a futures contract.

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 20 req/1s per IP |
| Bitget API | `GET /api/v2/mix/market/current-fund-rate` or `GET /api/v2/mix/market/history-fund-rate` or `GET /api/v2/mix/market/funding-time` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | Yes | Contract symbol |
| `history` | boolean | No | `false` (default) returns current rate + next funding time. `true` returns historical rates. |
| `pageSize` | number | No | Number of historical records. Default 20, max 100. |
| `pageNo` | number | No | Page number for historical data |

---

### futures_get_open_interest

> Get the total open interest for a futures contract.

| Field | Value |
|-------|-------|
| Auth | Public |
| Risk | [READ] |
| Rate limit | 20 req/1s per IP |
| Bitget API | `GET /api/v2/mix/market/open-interest` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | Yes | Contract symbol |

---

### futures_place_order

> Place one or more futures orders with optional TP/SL. Supports limit, market. [CAUTION] Executes real trades.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/mix/order/place-order` or `POST /api/v2/mix/order/batch-place-order` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orders` | array | Yes | Array of order objects (single = array of 1) |
| `orders[].productType` | string | Yes | Futures product type |
| `orders[].symbol` | string | Yes | Contract symbol |
| `orders[].side` | string | Yes | `"buy"` or `"sell"` |
| `orders[].tradeSide` | string | No | `"open"` or `"close"`. Required for hedge (two-way) mode. |
| `orders[].orderType` | string | Yes | `"limit"` or `"market"` |
| `orders[].price` | string | Conditional | Required for limit orders |
| `orders[].size` | string | Yes | Order quantity |
| `orders[].marginCoin` | string | Yes | Margin coin, e.g. `"USDT"` |
| `orders[].clientOid` | string | No | Client order ID |
| `orders[].force` | string | No | `"GTC"` (default), `"IOC"`, `"FOK"`, `"POST_ONLY"` |
| `orders[].presetStopSurplusPrice` | string | No | Take-profit trigger price |
| `orders[].presetStopLossPrice` | string | No | Stop-loss trigger price |

---

### futures_cancel_orders

> Cancel one or more futures orders. Supports single, batch, and cancel-all.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/mix/order/cancel-order` or `POST /api/v2/mix/order/batch-cancel-orders` or `POST /api/v2/mix/order/cancel-all-orders` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | Yes | Contract symbol |
| `orderId` | string | No | Cancel single order |
| `orderIds` | array | No | Cancel multiple orders (max 50) |
| `cancelAll` | boolean | No | Cancel all open orders for the symbol |
| `marginCoin` | string | No | Required when `cancelAll=true` |

---

### futures_get_orders

> Query futures orders: open, historical, or by specific order ID.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/mix/order/detail` or `GET /api/v2/mix/order/orders-pending` or `GET /api/v2/mix/order/orders-history` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `orderId` | string | No | Query specific order. If provided, symbol also required. |
| `symbol` | string | No | Filter by contract symbol |
| `status` | string | No | `"open"` (default) for pending, `"history"` for filled/cancelled |
| `startTime` | string | No | Start time (ms) |
| `endTime` | string | No | End time (ms) |
| `limit` | number | No | Default 100, max 500 |

---

### futures_get_fills

> Get trade execution details (fills) for futures orders.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/mix/order/fills` or `GET /api/v2/mix/order/fill-history` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | No | Filter by contract |
| `orderId` | string | No | Filter by order ID |
| `startTime` | string | No | Start time (ms) |
| `endTime` | string | No | End time (ms) |
| `limit` | number | No | Default 100, max 500 |

---

### futures_get_positions

> Get current or historical futures positions.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/mix/position/single-position` or `GET /api/v2/mix/position/all-position` or `GET /api/v2/mix/position/history-position` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | No | Filter by contract. If omitted, returns all positions. |
| `marginCoin` | string | No | Filter by margin coin |
| `history` | boolean | No | `false` (default) for current positions, `true` for closed/liquidated positions |

---

### futures_set_leverage

> Set leverage multiplier for a futures contract. [CAUTION] Affects risk exposure.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 5 req/1s per UID |
| Bitget API | `POST /api/v2/mix/account/set-leverage` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | Yes | Contract symbol |
| `marginCoin` | string | Yes | Margin coin |
| `leverage` | string | Yes | Leverage value, e.g. `"10"`, `"20"` |
| `holdSide` | string | No | `"long"` or `"short"`. Required for hedge mode to set different leverage per side. |

---

### futures_update_config

> Update futures account configuration: margin mode, position mode, auto-margin. [CAUTION] Affects trading behavior.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 5 req/1s per UID |
| Bitget API | `POST /api/v2/mix/account/set-margin-mode` or `POST /api/v2/mix/account/set-position-mode` or `POST /api/v2/mix/account/set-auto-margin` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type |
| `symbol` | string | Yes | Contract symbol |
| `marginCoin` | string | Yes | Margin coin |
| `setting` | string | Yes | What to configure: `"marginMode"`, `"positionMode"`, `"autoMargin"` |
| `value` | string | Yes | For `marginMode`: `"crossed"` or `"isolated"`. For `positionMode`: `"one_way_mode"` or `"hedge_mode"`. For `autoMargin`: `"on"` or `"off"`. |

---

<a id="module-account"></a>
## Module: account (8 tools)

Default loaded. Cross-module account management, asset queries, transfers, and withdrawals.

---

### get_account_assets

> Get account assets overview. Supports spot, futures, funding account, or all accounts combined.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/spot/account/assets` or `GET /api/v2/mix/account/accounts` or `GET /api/v2/account/funding-assets` or `GET /api/v2/account/all-account-balance` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `accountType` | string | No | `"spot"`, `"futures"`, `"funding"`, `"all"` (default `"all"`) |
| `coin` | string | No | Filter by specific coin, e.g. `"USDT"` |
| `productType` | string | No | Required when `accountType="futures"`: `"USDT-FUTURES"`, `"USDC-FUTURES"`, `"COIN-FUTURES"` |

---

### get_account_bills

> Get account transaction bills / flow records.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/spot/account/bills` or `GET /api/v2/mix/account/bill` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `accountType` | string | No | `"spot"` (default) or `"futures"` |
| `coin` | string | No | Filter by coin |
| `productType` | string | No | Required for futures bills |
| `businessType` | string | No | Bill type filter |
| `startTime` | string | No | Start time (ms) |
| `endTime` | string | No | End time (ms) |
| `limit` | number | No | Default 100, max 500 |

---

### transfer

> Transfer assets between accounts (spot, futures, funding) or between main and sub-accounts. [CAUTION] Moves funds.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/spot/wallet/transfer` or `POST /api/v2/spot/wallet/subaccount-transfer` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `fromAccountType` | string | Yes | Source: `"spot"`, `"usdt_futures"`, `"coin_futures"`, `"usdc_futures"`, `"funding"` |
| `toAccountType` | string | Yes | Destination (same options) |
| `coin` | string | Yes | Coin to transfer, e.g. `"USDT"` |
| `amount` | string | Yes | Amount to transfer as string |
| `subAccountUid` | string | No | If provided, performs sub-account transfer. The UID of the sub-account. |

---

### withdraw

> Withdraw assets from Bitget to external address. [DANGER] Irreversible fund movement.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [DANGER] |
| Rate limit | 1 req/1s per UID |
| Bitget API | `POST /api/v2/spot/wallet/withdrawal` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coin` | string | Yes | Coin to withdraw, e.g. `"USDT"` |
| `transferType` | string | Yes | `"on_chain"` or `"internal_transfer"` (Bitget-to-Bitget) |
| `address` | string | Yes | Withdrawal address (or Bitget UID for internal) |
| `chain` | string | Conditional | Required for on-chain. Chain name, e.g. `"TRC20"`, `"ERC20"` |
| `amount` | string | Yes | Withdrawal amount |
| `tag` | string | No | Memo/tag (required for some chains like XRP, EOS) |
| `clientOid` | string | No | Client-defined ID for idempotency |

---

### cancel_withdrawal

> Cancel a pending withdrawal request.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/spot/wallet/cancel-withdrawal` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string | Yes | Withdrawal order ID to cancel |

---

### get_deposit_address

> Get deposit address for a specific coin and chain.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/spot/wallet/deposit-address` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coin` | string | Yes | Coin name, e.g. `"USDT"` |
| `chain` | string | No | Chain name, e.g. `"TRC20"`. If omitted, returns addresses for all chains. |

**Response fields:** `coin`, `address`, `chain`, `tag`, `url`

---

### get_transaction_records

> Get deposit, withdrawal, or transfer history records.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/spot/wallet/deposit-records` or `GET /api/v2/spot/wallet/withdrawal-records` or `GET /api/v2/spot/account/transferRecords` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `recordType` | string | Yes | `"deposit"`, `"withdrawal"`, or `"transfer"` |
| `coin` | string | No | Filter by coin |
| `startTime` | string | No | Start time (ms) |
| `endTime` | string | No | End time (ms) |
| `limit` | number | No | Default 100, max 500 |
| `orderId` | string | No | Filter by specific order ID |

---

### manage_subaccounts

> Create, modify, or query virtual sub-accounts and their API keys.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 5 req/1s per UID |
| Bitget API | `POST /api/v2/user/create-virtual-subaccount` or `POST /api/v2/user/modify-virtual-subaccount` or `GET /api/v2/user/virtual-subaccount-list` or API key management endpoints |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | string | Yes | `"create"`, `"modify"`, `"list"`, `"createApiKey"`, `"modifyApiKey"`, `"listApiKeys"` |
| `subAccountName` | string | Conditional | Required for create/modify |
| `subAccountUid` | string | Conditional | Required for modify and API key operations |
| `remark` | string | No | Remark for the sub-account |
| `apiKeyPermissions` | string | No | For createApiKey: `"read_only"`, `"trade"`, `"transfer"` |
| `apiKeyIp` | string | No | IP whitelist for API key |
| `apiKeyPassphrase` | string | No | Passphrase for new API key |

---

<a id="module-margin"></a>
## Module: margin (7 tools)

Optional. Covers cross and isolated margin trading.

---

### margin_get_assets

> Get cross or isolated margin account assets, risk rate, and borrowable amounts.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/margin/crossed/account/assets` or `GET /api/v2/margin/isolated/account/assets` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes | `"crossed"` or `"isolated"` |
| `symbol` | string | No | Required for isolated margin. Trading pair. |
| `coin` | string | No | Filter by coin |

---

### margin_borrow

> Borrow assets in cross or isolated margin mode. [CAUTION] Creates debt position.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/margin/crossed/account/borrow` or `POST /api/v2/margin/isolated/account/borrow` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes | `"crossed"` or `"isolated"` |
| `coin` | string | Yes | Coin to borrow |
| `amount` | string | Yes | Borrow amount |
| `symbol` | string | Conditional | Required for isolated margin |

---

### margin_repay

> Repay borrowed assets. Supports normal and flash repay (auto repay all). [CAUTION] Uses account funds.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/margin/crossed/account/repay` or `POST /api/v2/margin/isolated/account/repay` or flash-repay endpoints |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes | `"crossed"` or `"isolated"` |
| `coin` | string | Yes | Coin to repay |
| `amount` | string | Conditional | Repay amount. Not needed for flash repay. |
| `symbol` | string | Conditional | Required for isolated margin |
| `flashRepay` | boolean | No | If `true`, automatically repay all debt for the coin |

---

### margin_place_order

> Place a margin trade order. [CAUTION] Executes real trade with borrowed funds.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `POST /api/v2/margin/crossed/order/place-order` or `POST /api/v2/margin/isolated/order/place-order` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes | `"crossed"` or `"isolated"` |
| `symbol` | string | Yes | Trading pair |
| `side` | string | Yes | `"buy"` or `"sell"` |
| `orderType` | string | Yes | `"limit"` or `"market"` |
| `price` | string | Conditional | Required for limit orders |
| `size` | string | Yes | Order quantity |
| `loanType` | string | No | `"normal"`, `"autoLoan"`, `"autoRepay"`, `"autoLoanAndRepay"` |

---

### margin_cancel_orders

> Cancel margin orders.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |
| Bitget API | Cancel endpoints for cross/isolated margin |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes | `"crossed"` or `"isolated"` |
| `symbol` | string | Yes | Trading pair |
| `orderId` | string | No | Cancel single order |
| `orderIds` | array | No | Cancel multiple orders |

---

### margin_get_orders

> Query margin orders (open or historical).

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | Order query endpoints for cross/isolated margin |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes | `"crossed"` or `"isolated"` |
| `symbol` | string | No | Filter by trading pair |
| `orderId` | string | No | Query specific order |
| `status` | string | No | `"open"` or `"history"` |
| `startTime` | string | No | Start time (ms) |
| `endTime` | string | No | End time (ms) |
| `limit` | number | No | Default 100 |

---

### margin_get_records

> Get margin borrow/repay/interest/liquidation records.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | Borrow/repay/interest/liquidation record endpoints |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes | `"crossed"` or `"isolated"` |
| `recordType` | string | Yes | `"borrow"`, `"repay"`, `"interest"`, `"liquidation"` |
| `coin` | string | No | Filter by coin |
| `symbol` | string | No | Filter by symbol (isolated) |
| `startTime` | string | No | Start time (ms) |
| `endTime` | string | No | End time (ms) |
| `limit` | number | No | Default 100 |

---

<a id="module-copytrading"></a>
## Module: copytrading (5 tools)

Optional. Futures and spot copy trading.

---

### copy_get_traders

> Get elite trader list and copy trading configuration.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | No | `"USDT-FUTURES"`, `"COIN-FUTURES"`, `"SPOT"` |

---

### copy_place_order

> Place a copy trading order. [CAUTION] Executes real trade.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Product type |
| `symbol` | string | Yes | Trading pair/contract |
| `side` | string | Yes | `"buy"` or `"sell"` |
| `orderType` | string | Yes | `"limit"` or `"market"` |
| `price` | string | Conditional | For limit orders |
| `size` | string | Yes | Order size |

---

### copy_close_position

> Close a copy trading position. [CAUTION] Closes position at market.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 10 req/1s per UID |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Product type |
| `symbol` | string | Yes | Trading pair/contract |
| `subPosId` | string | No | Specific position ID to close |

---

### copy_get_orders

> Query copy trading orders.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Product type |
| `symbol` | string | No | Filter by symbol |
| `startTime` | string | No | Start time (ms) |
| `endTime` | string | No | End time (ms) |
| `limit` | number | No | Default 100 |

---

### copy_get_positions

> Get copy trading positions (current or history).

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Product type |
| `symbol` | string | No | Filter by symbol |
| `history` | boolean | No | `false` for current, `true` for historical |

---

<a id="module-convert"></a>
## Module: convert (3 tools)

Optional. Currency conversion / small balance sweep.

---

### convert_get_quote

> Get conversion quote and list of supported currencies.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/convert/currencies` or `GET /api/v2/convert/quoted-price` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `fromCoin` | string | No | Source coin. If omitted, returns supported currency list. |
| `toCoin` | string | No | Target coin. Required when `fromCoin` is provided. |
| `fromCoinAmount` | string | No | Amount of source coin to convert |
| `toCoinAmount` | string | No | Desired amount of target coin |

---

### convert_execute

> Execute a currency conversion or BGB small balance sweep. [CAUTION] Converts funds.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 5 req/1s per UID |
| Bitget API | `POST /api/v2/convert/trade` or `POST /api/v2/convert/bgb-convert` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | string | No | `"normal"` (default) for regular conversion, `"bgb"` for BGB small balance sweep |
| `fromCoin` | string | Yes | Source coin |
| `toCoin` | string | Yes | Target coin |
| `fromCoinAmount` | string | Conditional | Amount to convert (for normal) |
| `coinList` | array | Conditional | List of coins for BGB sweep (for bgb type) |

---

### convert_get_history

> Get conversion or BGB sweep history records.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/convert/convert-record` or `GET /api/v2/convert/bgb-convert-records` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | string | No | `"normal"` (default) or `"bgb"` |
| `startTime` | string | No | Start time (ms) |
| `endTime` | string | No | End time (ms) |
| `limit` | number | No | Default 100 |

---

<a id="module-earn"></a>
## Module: earn (3 tools)

Optional. Savings / staking products.

---

### earn_get_products

> Query available earn products (savings, staking).

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coin` | string | No | Filter by coin |
| `productType` | string | No | Product type filter |

---

### earn_subscribe_redeem

> Subscribe to or redeem from an earn product. [CAUTION] Locks/releases funds.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 5 req/1s per UID |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | string | Yes | `"subscribe"` or `"redeem"` |
| `productId` | string | Yes | Product ID from `earn_get_products` |
| `amount` | string | Yes | Amount to subscribe/redeem |
| `coin` | string | Yes | Coin name |

---

### earn_get_holdings

> Get earn holdings and earnings records.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coin` | string | No | Filter by coin |
| `productId` | string | No | Filter by product |

---

<a id="module-p2p"></a>
## Module: p2p (2 tools)

Optional. Peer-to-peer trading data.

---

### p2p_get_merchants

> Get P2P merchant list or specific merchant info.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/p2p/merchantList` or `GET /api/v2/p2p/merchantInfo` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `merchantId` | string | No | If provided, returns specific merchant info. Otherwise returns list. |

---

### p2p_get_orders

> Get P2P orders and advertisements.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/p2p/orderList` or `GET /api/v2/p2p/advList` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | string | No | `"orders"` (default) or `"advertisements"` |
| `status` | string | No | Filter by status |
| `startTime` | string | No | Start time (ms) |
| `endTime` | string | No | End time (ms) |

---

<a id="module-broker"></a>
## Module: broker (3 tools)

Optional. Broker / affiliate management.

---

### broker_get_info

> Get broker account information and commission data.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [READ] |
| Rate limit | 10 req/1s per UID |
| Bitget API | `GET /api/v2/broker/account/info` |

---

### broker_manage_subaccounts

> Create, modify, or query broker sub-accounts.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 5 req/1s per UID |
| Bitget API | `POST /api/v2/broker/account/create-subaccount` or `POST /api/v2/broker/account/modify-subaccount` or `GET /api/v2/broker/account/subaccount-list` |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | string | Yes | `"create"`, `"modify"`, or `"list"` |
| `subAccountUid` | string | Conditional | Required for modify |
| `subAccountName` | string | Conditional | Required for create |
| `remark` | string | No | Account remark |
| `limit` | number | No | For list pagination |

---

### broker_manage_apikeys

> Create, modify, or query API keys for broker sub-accounts.

| Field | Value |
|-------|-------|
| Auth | Private |
| Risk | [WRITE] |
| Rate limit | 5 req/1s per UID |

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | string | Yes | `"create"`, `"modify"`, or `"list"` |
| `subAccountUid` | string | Yes | Sub-account UID |
| `apiKeyPermissions` | string | No | For create: `"read_only"`, `"trade"`, `"transfer"` |
| `apiKeyIp` | string | No | IP whitelist |
| `apiKeyPassphrase` | string | Conditional | Required for create |

---

## Appendix: Tool Count Summary

| Module | Read Tools | Write Tools | Total | Default |
|--------|-----------|-------------|-------|---------|
| spot | 5 | 7 | 12 | Yes |
| futures | 7 | 7 | 14 | Yes |
| account | 4 | 4 | 8 | Yes |
| margin | 2 | 5 | 7 | No |
| copytrading | 2 | 3 | 5 | No |
| convert | 2 | 1 | 3 | No |
| earn | 2 | 1 | 3 | No |
| p2p | 2 | 0 | 2 | No |
| broker | 1 | 2 | 3 | No |
| **Total** | **27** | **30** | **57** | **34** |

**Read-only mode** (`--read-only`): Exposes only the 27 read tools.
