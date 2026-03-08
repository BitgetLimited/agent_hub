# bgc Command Reference — Agent Account

Auto-generated from bitget-core tool definitions (agent-safe subset).

Excluded: `transfer`, `withdraw`, `manage_subaccounts` — virtual sub-account
API key has no permission for these operations.

## Usage

```
bgc <module> <tool_name> [--param value ...]
```

## Table of Contents

- [spot](#module-spot) — spot_get_ticker, spot_get_depth, spot_get_candles, spot_get_trades, spot_get_symbols, spot_place_order, spot_cancel_orders, spot_modify_order, spot_get_orders, spot_get_fills, spot_place_plan_order, spot_get_plan_orders, spot_cancel_plan_orders
- [futures](#module-futures) — futures_get_ticker, futures_get_depth, futures_get_candles, futures_get_trades, futures_get_contracts, futures_get_funding_rate, futures_get_open_interest, futures_place_order, futures_cancel_orders, futures_get_orders, futures_get_fills, futures_get_positions, futures_set_leverage, futures_update_config
- [account](#module-account) — get_account_assets, get_account_bills

> **Write operations** (marked ✏️) require user confirmation before execution.

## Module: spot

### `spot_get_ticker`

Get real-time ticker data for spot trading pair(s). Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | No | Trading pair symbol, e.g. BTCUSDT. Omit for all tickers. |

**Example:**
```bash
bgc spot spot_get_ticker --symbol <value>
```

### `spot_get_depth`

Get orderbook depth for a spot trading pair. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol, e.g. BTCUSDT |
| `type` | string | No | Depth merge level. step0 means raw orderbook. |
| `limit` | number | No | Depth levels, default 150, max 150. |

**Example:**
```bash
bgc spot spot_get_depth --symbol <value> --type <value>
```

### `spot_get_candles`

Get K-line data for spot trading pair. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol, e.g. BTCUSDT |
| `granularity` | string | Yes | Candlestick period. |
| `startTime` | string | No | Start time in milliseconds. |
| `endTime` | string | No | End time in milliseconds. |
| `limit` | number | No | Result size, default 100, max 1000. |

**Example:**
```bash
bgc spot spot_get_candles --symbol <value> --granularity <value>
```

### `spot_get_trades`

Get recent or historical trade records for spot symbol. Public endpoint. Rate limit: 10 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol. |
| `limit` | number | No | Result size, default 100, max 500. |
| `startTime` | string | No | Start time in milliseconds. |
| `endTime` | string | No | End time in milliseconds. |

**Example:**
```bash
bgc spot spot_get_trades --symbol <value> --limit <value>
```

### `spot_get_symbols`

Get spot symbol info or coin chain info. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | string | No | symbols(default) or coins. |
| `symbol` | string | No | Specific symbol filter. |
| `coin` | string | No | Specific coin filter. |

**Example:**
```bash
bgc spot spot_get_symbols --type <value> --symbol <value>
```

### `spot_place_order` ✏️

Place one or more spot orders. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orders` | array | Yes | Array of order objects. Single order should still be passed as an array with one item. |

**Example:**
```bash
bgc spot spot_place_order --orders <value>
```

### `spot_cancel_orders` ✏️

Cancel one or more spot orders by id, batch ids, or symbol-wide cancel. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol. |
| `orderId` | string | No | Single order id. |
| `orderIds` | array | No | Multiple order ids. Max 50. |
| `cancelAll` | boolean | No | If true, cancel all open orders for symbol. |

**Example:**
```bash
bgc spot spot_cancel_orders --symbol <value> --orderId <value>
```

### `spot_modify_order` ✏️

Cancel and replace a spot order atomically. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol. |
| `orderId` | string | Yes | Original order id. |
| `newPrice` | string | No | New price for limit order. |
| `newSize` | string | No | New order size. |
| `newClientOid` | string | No | New client order id. |

**Example:**
```bash
bgc spot spot_modify_order --symbol <value> --orderId <value>
```

### `spot_get_orders`

Query spot order detail, open orders, or history orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string | No | Specific order id. |
| `symbol` | string | No | Trading pair filter. |
| `status` | string | No | open(default) or history. |
| `startTime` | string | No | Start time in milliseconds. |
| `endTime` | string | No | End time in milliseconds. |
| `limit` | number | No | Result size, default 100. |
| `idLessThan` | string | No | Pagination cursor. |

**Example:**
```bash
bgc spot spot_get_orders --orderId <value> --symbol <value>
```

### `spot_get_fills`

Get spot fills for order execution details. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol. |
| `orderId` | string | No | Specific order id. |
| `startTime` | string | No | Start time in milliseconds. |
| `endTime` | string | No | End time in milliseconds. |
| `limit` | number | No | Result size, default 100. |

**Example:**
```bash
bgc spot spot_get_fills --symbol <value> --orderId <value>
```

### `spot_place_plan_order` ✏️

Create or modify spot plan order (trigger order). Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string | No | When provided, modify existing plan order. |
| `symbol` | string | No | Trading pair symbol. |
| `side` | string | No | Order side. |
| `triggerPrice` | string | Yes | Trigger price. |
| `triggerType` | string | No | Trigger source. |
| `orderType` | string | No | Execution order type. |
| `price` | string | No | Execution price for limit orders. |
| `size` | string | No | Order quantity. |

**Example:**
```bash
bgc spot spot_place_plan_order --orderId <value> --symbol <value>
```

### `spot_get_plan_orders`

Get current or historical spot plan orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol. |
| `status` | string | No | current(default) or history. |
| `startTime` | string | No | Start time in milliseconds. |
| `endTime` | string | No | End time in milliseconds. |
| `limit` | number | No | Result size, default 100. |

**Example:**
```bash
bgc spot spot_get_plan_orders --symbol <value> --status <value>
```

### `spot_cancel_plan_orders` ✏️

Cancel one or multiple spot plan orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string | No | Single plan order id. |
| `orderIds` | array | No | Multiple plan order ids. |
| `symbol` | string | No | Cancel all plan orders for symbol. |

**Example:**
```bash
bgc spot spot_cancel_plan_orders --orderId <value> --orderIds <value>
```

## Module: futures

### `futures_get_ticker`

Get futures ticker for one symbol or all symbols in product type. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | Futures product type. |
| `symbol` | string | No | Contract symbol, e.g. BTCUSDT. |

**Example:**
```bash
bgc futures futures_get_ticker --productType <value> --symbol <value>
```

### `futures_get_depth`

Get futures orderbook depth with precision levels. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | Yes | Contract symbol. |
| `limit` | number | No | Depth levels, default 100. |
| `precision` | string | No | Merge precision value. |

**Example:**
```bash
bgc futures futures_get_depth --productType <value> --symbol <value>
```

### `futures_get_candles`

Get futures candles from trade/index/mark price sources. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | Yes |  |
| `granularity` | string | Yes |  |
| `priceType` | string | No | trade(default), index, or mark. |
| `startTime` | string | No |  |
| `endTime` | string | No |  |
| `limit` | number | No |  |

**Example:**
```bash
bgc futures futures_get_candles --productType <value> --symbol <value>
```

### `futures_get_trades`

Get recent or historical futures trade records. Public endpoint. Rate limit: 10 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | Yes |  |
| `limit` | number | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |

**Example:**
```bash
bgc futures futures_get_trades --productType <value> --symbol <value>
```

### `futures_get_contracts`

Get futures contract configuration details. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | No | Optional symbol filter. |

**Example:**
```bash
bgc futures futures_get_contracts --productType <value> --symbol <value>
```

### `futures_get_funding_rate`

Get current or historical funding rates for a futures symbol. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | Yes |  |
| `history` | boolean | No | true for historical funding rates. |
| `pageSize` | number | No | Page size for history mode. |
| `pageNo` | number | No | Page number for history mode. |

**Example:**
```bash
bgc futures futures_get_funding_rate --productType <value> --symbol <value>
```

### `futures_get_open_interest`

Get open interest for a futures contract. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | Yes |  |

**Example:**
```bash
bgc futures futures_get_open_interest --productType <value> --symbol <value>
```

### `futures_place_order` ✏️

Place one or more futures orders with optional TP/SL. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orders` | array | Yes | Array of futures order objects. |

**Example:**
```bash
bgc futures futures_place_order --orders <value>
```

### `futures_cancel_orders` ✏️

Cancel futures orders by order id, batch ids, or cancel-all mode. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | Yes |  |
| `orderId` | string | No |  |
| `orderIds` | array | No |  |
| `cancelAll` | boolean | No |  |
| `marginCoin` | string | No |  |

**Example:**
```bash
bgc futures futures_cancel_orders --productType <value> --symbol <value>
```

### `futures_get_orders`

Query futures orders by id, open status, or history. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `orderId` | string | No |  |
| `symbol` | string | No |  |
| `status` | string | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |
| `limit` | number | No |  |

**Example:**
```bash
bgc futures futures_get_orders --productType <value> --orderId <value>
```

### `futures_get_fills`

Get futures fills and fill history records. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | No |  |
| `orderId` | string | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |
| `limit` | number | No |  |

**Example:**
```bash
bgc futures futures_get_fills --productType <value> --symbol <value>
```

### `futures_get_positions`

Get current or historical futures positions. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | No |  |
| `marginCoin` | string | No |  |
| `history` | boolean | No |  |

**Example:**
```bash
bgc futures futures_get_positions --productType <value> --symbol <value>
```

### `futures_set_leverage` ✏️

Set futures leverage for symbol and margin coin. [CAUTION] Affects risk exposure. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | Yes |  |
| `marginCoin` | string | Yes |  |
| `leverage` | string | Yes |  |
| `holdSide` | string | No |  |

**Example:**
```bash
bgc futures futures_set_leverage --productType <value> --symbol <value>
```

### `futures_update_config` ✏️

Update futures margin mode, position mode, or auto-margin setting. [CAUTION] Affects trading behavior. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | Yes |  |
| `marginCoin` | string | Yes |  |
| `setting` | string | Yes |  |
| `value` | string | Yes |  |
| `holdSide` | string | No |  |

**Example:**
```bash
bgc futures futures_update_config --productType <value> --symbol <value>
```

## Module: account

### `get_account_assets`

Get spot/futures/funding/all account balances. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `accountType` | string | No | Target account type. Default all. |
| `coin` | string | No | Optional coin filter. |
| `productType` | string | No | Required when accountType=futures. |

**Example:**
```bash
bgc account get_account_assets --accountType <value> --coin <value>
```

### `get_account_bills`

Get account bill records for spot or futures account. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `accountType` | string | No |  |
| `coin` | string | No |  |
| `productType` | string | No |  |
| `businessType` | string | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |
| `limit` | number | No |  |

**Example:**
```bash
bgc account get_account_bills --accountType <value> --coin <value>
```
