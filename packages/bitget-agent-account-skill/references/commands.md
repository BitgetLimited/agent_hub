# bgc Command Reference — Agent Account

Agent-safe subset of bgc commands. The following operations are excluded
intentionally: `transfer`, `withdraw`, `manage_subaccounts` — your virtual
sub-account API key has no permission for these.

## Usage

```
bgc <module> <tool_name> [--param value ...]
```

## Table of Contents

- [spot](#module-spot) — spot_get_ticker, spot_get_depth, spot_get_candles, spot_place_order, spot_place_plan_order, spot_get_orders, spot_cancel_orders, spot_get_fills
- [futures](#module-futures) — futures_get_ticker, futures_get_depth, futures_get_candles, futures_get_funding_rate, futures_get_open_interest, futures_place_order, futures_set_leverage, futures_get_positions, futures_get_orders, futures_cancel_orders, futures_get_fills
- [account](#module-account) — get_account_assets

> **Write operations** (marked ✏️) require user confirmation before execution.

---

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
bgc spot spot_get_ticker --symbol BTCUSDT
```

---

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
bgc spot spot_get_depth --symbol BTCUSDT
```

---

### `spot_get_candles`

Get K-line data for spot trading pair. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol, e.g. BTCUSDT |
| `granularity` | string | Yes | Candlestick period: 1min, 5min, 15min, 30min, 1h, 4h, 6h, 12h, 1day, 3day, 1week, 1M |
| `startTime` | string | No | Start time in milliseconds. |
| `endTime` | string | No | End time in milliseconds. |
| `limit` | number | No | Result size, default 100, max 1000. |

**Example:**
```bash
bgc spot spot_get_candles --symbol BTCUSDT --granularity 1h
```

---

### `spot_place_order` ✏️

Place one or more spot orders. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orders` | array | Yes | Array of order objects. Pass as JSON array. |

Order object fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | Yes | e.g. BTCUSDT |
| `side` | string | Yes | buy or sell |
| `orderType` | string | Yes | limit or market |
| `price` | string | No | Required for limit orders, e.g. "70000" |
| `size` | string | Yes | Quantity as string, e.g. "0.001" |

**Example:**
```bash
bgc spot spot_place_order --orders '[{"symbol":"BTCUSDT","side":"buy","orderType":"limit","price":"70000","size":"0.001"}]'
```

---

### `spot_place_plan_order` ✏️

Create a trigger/conditional order (stop-loss, take-profit). Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `triggerPrice` | string | Yes | Price that activates the order |
| `symbol` | string | Yes | Trading pair symbol |
| `side` | string | Yes | buy or sell |
| `orderType` | string | Yes | limit or market (execution type after trigger) |
| `size` | string | Yes | Quantity |
| `price` | string | No | Execution price for limit type |
| `triggerType` | string | No | mark_price, fill_price, or last_price (default) |

**Example:**
```bash
bgc spot spot_place_plan_order --symbol BTCUSDT --side sell --triggerPrice 68000 --orderType market --size 0.001
```

---

### `spot_get_orders`

Query open or historical spot orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `status` | string | No | open (default) or history |
| `symbol` | string | No | Filter by trading pair |
| `orderId` | string | No | Specific order id |
| `limit` | number | No | Result size, default 100 |

**Example:**
```bash
bgc spot spot_get_orders --status open
bgc spot spot_get_orders --status history --symbol BTCUSDT
```

---

### `spot_cancel_orders` ✏️

Cancel one or more spot orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol |
| `orderId` | string | No | Single order id |
| `orderIds` | array | No | Multiple order ids (max 50) |
| `cancelAll` | boolean | No | If true, cancel all open orders for symbol |

**Example:**
```bash
bgc spot spot_cancel_orders --symbol BTCUSDT --orderId 1234567890
bgc spot spot_cancel_orders --symbol BTCUSDT --cancelAll true
```

---

### `spot_get_fills`

Get spot fill/execution details. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol |
| `orderId` | string | No | Filter by order id |
| `limit` | number | No | Result size, default 100 |

**Example:**
```bash
bgc spot spot_get_fills --symbol BTCUSDT
```

---

## Module: futures

### `futures_get_ticker`

Get futures ticker. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | No | Contract symbol, e.g. BTCUSDT |

**Example:**
```bash
bgc futures futures_get_ticker --productType USDT-FUTURES --symbol BTCUSDT
```

---

### `futures_get_depth`

Get futures orderbook depth. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |
| `limit` | number | No | Depth levels, default 100 |

**Example:**
```bash
bgc futures futures_get_depth --productType USDT-FUTURES --symbol BTCUSDT
```

---

### `futures_get_candles`

Get futures K-line data. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |
| `granularity` | string | Yes | 1min, 5min, 15min, 30min, 1h, 4h, 6h, 12h, 1day, 3day, 1week, 1M |
| `priceType` | string | No | trade (default), index, or mark |

**Example:**
```bash
bgc futures futures_get_candles --productType USDT-FUTURES --symbol BTCUSDT --granularity 1h
```

---

### `futures_get_funding_rate`

Get current or historical funding rate. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |
| `history` | boolean | No | true for historical rates |

**Example:**
```bash
bgc futures futures_get_funding_rate --productType USDT-FUTURES --symbol BTCUSDT
```

---

### `futures_get_open_interest`

Get open interest for a contract. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |

**Example:**
```bash
bgc futures futures_get_open_interest --productType USDT-FUTURES --symbol BTCUSDT
```

---

### `futures_place_order` ✏️

Place one or more futures orders. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orders` | array | Yes | Array of futures order objects |

Order object fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol, e.g. BTCUSDT |
| `side` | string | Yes | buy or sell |
| `tradeSide` | string | Yes | open or close |
| `orderType` | string | Yes | limit or market |
| `size` | string | Yes | Quantity as string |
| `price` | string | No | Required for limit orders |
| `marginCoin` | string | Yes | e.g. USDT |

**Example:**
```bash
bgc futures futures_place_order --orders '[{"productType":"USDT-FUTURES","symbol":"BTCUSDT","side":"buy","tradeSide":"open","orderType":"limit","price":"70000","size":"0.001","marginCoin":"USDT"}]'
```

---

### `futures_set_leverage` ✏️

Set leverage for a futures position. [CAUTION] Affects risk. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |
| `marginCoin` | string | Yes | e.g. USDT |
| `leverage` | string | Yes | Leverage as string, e.g. "5". Max 10x per risk rules. |
| `holdSide` | string | No | long or short (for one-way mode, omit) |

**Example:**
```bash
bgc futures futures_set_leverage --productType USDT-FUTURES --symbol BTCUSDT --marginCoin USDT --leverage 5
```

---

### `futures_get_positions`

Get current open futures positions. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | No | Filter by contract |
| `history` | boolean | No | true for closed position history |

**Example:**
```bash
bgc futures futures_get_positions --productType USDT-FUTURES
```

---

### `futures_get_orders`

Query open or historical futures orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `status` | string | No | open or history |
| `symbol` | string | No | Filter by contract |

**Example:**
```bash
bgc futures futures_get_orders --productType USDT-FUTURES --status open
```

---

### `futures_cancel_orders` ✏️

Cancel futures orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |
| `orderId` | string | No | Single order id |
| `cancelAll` | boolean | No | If true, cancel all open orders for symbol |

**Example:**
```bash
bgc futures futures_cancel_orders --productType USDT-FUTURES --symbol BTCUSDT --orderId 1234567890
```

---

### `futures_get_fills`

Get futures fill/execution details. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | No | Filter by contract |
| `orderId` | string | No | Filter by order id |

**Example:**
```bash
bgc futures futures_get_fills --productType USDT-FUTURES
```

---

## Module: account

### `get_account_assets`

Get spot/futures/funding account balances. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `accountType` | string | No | spot, futures, funding, or all (default) |
| `coin` | string | No | Filter by coin |
| `productType` | string | No | Required when accountType=futures |

**Example:**
```bash
bgc account get_account_assets
bgc account get_account_assets --accountType spot --coin USDT
```

---

## Excluded commands

The following commands are NOT available in this skill. Your virtual sub-account
API key has no permission for these operations. Do not attempt to call them.

| Command | Reason excluded |
|---------|----------------|
| `transfer` | Sub-account has no transfer permission. User controls all fund movements. |
| `withdraw` | Sub-account has no withdrawal permission by design (core security guarantee). |
| `manage_subaccounts` | Not relevant to agent trading operations. |

If `withdraw` appears to be callable, warn the user immediately — they may be
using a main-account API key. Recommend switching to a virtual sub-account key.
