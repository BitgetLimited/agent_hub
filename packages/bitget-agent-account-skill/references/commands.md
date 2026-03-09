# bgc Command Reference — Agent Account

Auto-generated from bitget-core tool definitions (agent-safe subset).

Excluded: `transfer`, `withdraw`, `cancel_withdrawal`, `get_deposit_address`,
`get_transaction_records`, `manage_subaccounts` — virtual sub-account API key
has no permission for these operations.

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
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | Yes | Contract symbol, e.g. `BTCUSDT` |
| `limit` | number | No | Depth levels, default 100 |
| `precision` | string | No | Price merge precision (e.g. `"0.1"` groups bids/asks to nearest 0.1) |

**Example:**
```bash
bgc futures futures_get_depth --productType USDT-FUTURES --symbol BTCUSDT
```

### `futures_get_candles`

Get futures candles from trade/index/mark price sources. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | Yes | Contract symbol, e.g. `BTCUSDT` |
| `granularity` | string | Yes | Candle period: `1min`, `5min`, `15min`, `30min`, `1h`, `4h`, `6h`, `12h`, `1day`, `3day`, `1week`, `1M` |
| `priceType` | string | No | `trade` (default, last price), `index`, or `mark` |
| `startTime` | string | No | Start time in milliseconds |
| `endTime` | string | No | End time in milliseconds |
| `limit` | number | No | Result size, default 100, max 1000 |

**Example:**
```bash
bgc futures futures_get_candles --productType USDT-FUTURES --symbol BTCUSDT --granularity 1h
```

### `futures_get_trades`

Get recent or historical futures trade records. Public endpoint. Rate limit: 10 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | Yes | Contract symbol, e.g. `BTCUSDT` |
| `limit` | number | No | Result size, default 100, max 500 |
| `startTime` | string | No | Start time in milliseconds |
| `endTime` | string | No | End time in milliseconds |

**Example:**
```bash
bgc futures futures_get_trades --productType USDT-FUTURES --symbol BTCUSDT --limit 20
```

### `futures_get_contracts`

Get futures contract configuration details. Public endpoint. Rate limit: 20 req/s per IP.
Use this to check the min order size, price precision, and size precision before placing an order.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | No | Filter to a specific contract; omit for all contracts |

**Key response fields:** `minTradeNum` (min order size), `sizeMultiplier`, `priceEndStep` (price decimal places), `volumePlace` (size decimal places), `maxLever` (max leverage).

**Example:**
```bash
bgc futures futures_get_contracts --productType USDT-FUTURES --symbol BTCUSDT
```

### `futures_get_funding_rate`

Get current or historical funding rates for a futures symbol. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | Yes | Contract symbol, e.g. `BTCUSDT` |
| `history` | boolean | No | `true` to get historical funding rates (paginated) |
| `pageSize` | number | No | Page size for history mode |
| `pageNo` | number | No | Page number for history mode (1-based) |

> Current funding rate is returned when `history` is omitted. Check before opening positions — high funding rates increase holding cost.

**Example:**
```bash
bgc futures futures_get_funding_rate --productType USDT-FUTURES --symbol BTCUSDT
```

### `futures_get_open_interest`

Get open interest for a futures contract. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | Yes | Contract symbol, e.g. `BTCUSDT` |

> Open interest measures total outstanding contracts. Rising OI with rising price confirms trend strength.

**Example:**
```bash
bgc futures futures_get_open_interest --productType USDT-FUTURES --symbol BTCUSDT
```

### `futures_place_order` ✏️

Place one or more futures orders with optional TP/SL. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

The `orders` array contains one object per order. Each order object has:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair, e.g. `BTCUSDT` |
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `marginCoin` | string | Yes | Margin coin in uppercase, e.g. `USDT` |
| `marginMode` | string | No | `crossed` (default) or `isolated` |
| `side` | string | Yes | Direction: `buy` or `sell` |
| `tradeSide` | string | Conditional | Required in hedge-mode: `open` or `close` |
| `orderType` | string | Yes | `limit` or `market` |
| `size` | string | Yes | Position size in base coin (e.g. `"0.001"` BTC) |
| `price` | string | Conditional | Required when `orderType=limit` |
| `force` | string | No | Time-in-force: `gtc` (default for limit), `ioc`, `fok`, `post_only` |
| `reduceOnly` | string | No | `YES` to close without opening a new position (one-way mode only). Default `NO` |
| `presetStopSurplusPrice` | string | No | Preset take-profit trigger price |
| `presetStopLossPrice` | string | No | Preset stop-loss trigger price |
| `presetStopSurplusExecutePrice` | string | No | Take-profit execution price (for limit TP) |
| `presetStopLossExecutePrice` | string | No | Stop-loss execution price (for limit SL) |
| `clientOid` | string | No | Custom order ID for idempotency |

> **Batch limit:** max 50 orders per call. All orders in a batch must share the same `symbol`, `productType`, `marginCoin`, and `marginMode`.

---

**CRITICAL — Opening vs Closing positions (hedge-mode):**

| Intent | `side` | `tradeSide` |
|--------|--------|-------------|
| Open long | `buy` | `open` |
| Open short | `sell` | `open` |
| **Close long** | **`buy`** | **`close`** |
| **Close short** | **`sell`** | **`close`** |

> Close long uses `side=buy` (not `sell`). Close short uses `side=sell`.
> This is counterintuitive — the `side` matches the *direction of the position*, not the action.

**One-way mode:** omit `tradeSide`; use `reduceOnly=YES` to close without flipping.

---

**Example — Open long:**
```bash
bgc futures futures_place_order --orders '[{"symbol":"BTCUSDT","productType":"USDT-FUTURES","marginCoin":"USDT","side":"buy","tradeSide":"open","orderType":"limit","price":"70000","size":"0.001"}]'
```

**Example — Close long (market):**
```bash
bgc futures futures_place_order --orders '[{"symbol":"BTCUSDT","productType":"USDT-FUTURES","marginCoin":"USDT","side":"buy","tradeSide":"close","orderType":"market","size":"0.001"}]'
```

**Example — Close short (market):**
```bash
bgc futures futures_place_order --orders '[{"symbol":"BTCUSDT","productType":"USDT-FUTURES","marginCoin":"USDT","side":"sell","tradeSide":"close","orderType":"market","size":"0.001"}]'
```

**Example — Open long with TP/SL:**
```bash
bgc futures futures_place_order --orders '[{"symbol":"BTCUSDT","productType":"USDT-FUTURES","marginCoin":"USDT","side":"buy","tradeSide":"open","orderType":"limit","price":"70000","size":"0.001","presetStopSurplusPrice":"75000","presetStopLossPrice":"67000"}]'
```

### `futures_cancel_orders` ✏️

Cancel futures orders by order id, batch ids, or cancel-all mode. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | Yes | Trading pair symbol, e.g. `BTCUSDT` |
| `orderId` | string | No | Single order ID to cancel |
| `orderIds` | array | No | Multiple order IDs to cancel. Max 50. |
| `cancelAll` | boolean | No | Set `true` to cancel all open orders for the symbol |
| `marginCoin` | string | No | Required when using `cancelAll=true` |

> Provide exactly one of: `orderId`, `orderIds`, or `cancelAll=true`.

**Example — cancel single order:**
```bash
bgc futures futures_cancel_orders --productType USDT-FUTURES --symbol BTCUSDT --orderId 123456789
```

**Example — cancel all orders for symbol:**
```bash
bgc futures futures_cancel_orders --productType USDT-FUTURES --symbol BTCUSDT --cancelAll true --marginCoin USDT
```

### `futures_get_orders`

Query futures orders by id, open status, or history. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `orderId` | string | No | Look up a specific order by ID |
| `symbol` | string | No | Filter by trading pair |
| `status` | string | No | `open` (default, pending orders) or `history` (filled/cancelled) |
| `startTime` | string | No | Start time in milliseconds |
| `endTime` | string | No | End time in milliseconds |
| `limit` | number | No | Result size, default 100 |

**Example:**
```bash
bgc futures futures_get_orders --productType USDT-FUTURES --status open
bgc futures futures_get_orders --productType USDT-FUTURES --status history --symbol BTCUSDT
```

### `futures_get_fills`

Get futures fills and fill history records. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | No | Filter by trading pair |
| `orderId` | string | No | Filter fills for a specific order |
| `startTime` | string | No | Start time in milliseconds (enables historical fill query) |
| `endTime` | string | No | End time in milliseconds |
| `limit` | number | No | Result size, default 100 |

> If `startTime` is provided, queries historical fills. Otherwise returns recent fills.

**Example:**
```bash
bgc futures futures_get_fills --productType USDT-FUTURES --symbol BTCUSDT
```

### `futures_get_positions`

Get current or historical futures positions. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | No | Omit to get all open positions; include to get a specific symbol's position |
| `marginCoin` | string | No | Defaults to `USDT` when `symbol` is provided |
| `history` | boolean | No | `true` to get closed position history instead of open positions |

**Key response fields:**

| Field | Description |
|-------|-------------|
| `holdSide` | `long` or `short` — the position direction |
| `available` | **Closable quantity** — the max size you can close right now |
| `total` | Total position size (`available + frozen`) |
| `avgOpenPrice` | Average entry price |
| `unrealizedPL` | Unrealized profit/loss |
| `leverage` | Current leverage |
| `marginMode` | `crossed` or `isolated` |
| `liquidationPrice` | Estimated liquidation price |

> Use `available` (not `total`) as the `size` when placing a full-close order.

**Example:**
```bash
bgc futures futures_get_positions --productType USDT-FUTURES
bgc futures futures_get_positions --productType USDT-FUTURES --symbol BTCUSDT
```

### `futures_set_leverage` ✏️

Set futures leverage for symbol and margin coin. [CAUTION] Affects risk exposure. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | Yes | Trading pair, e.g. `BTCUSDT` |
| `marginCoin` | string | Yes | Margin coin in uppercase, e.g. `USDT` |
| `leverage` | string | Yes | Leverage multiplier as string, e.g. `"5"` or `"10"` |
| `holdSide` | string | No | `long` or `short` — required in hedge-mode to set leverage per side |

> Risk control: leverage must be ≤ 10x unless user explicitly overrides.

**Example:**
```bash
bgc futures futures_set_leverage --productType USDT-FUTURES --symbol BTCUSDT --marginCoin USDT --leverage 5
```

### `futures_update_config` ✏️

Update futures margin mode, position mode, or auto-margin setting. [CAUTION] Affects trading behavior. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `symbol` | string | Yes | Trading pair, e.g. `BTCUSDT` |
| `marginCoin` | string | Yes | Margin coin in uppercase, e.g. `USDT` |
| `setting` | string | Yes | Which setting to change: `marginMode`, `positionMode`, or `autoMargin` |
| `value` | string | Yes | New value (see table below) |
| `holdSide` | string | No | `long` or `short` — required for `autoMargin` setting |

**Valid values per setting:**

| `setting` | Valid `value` options |
|-----------|-----------------------|
| `marginMode` | `crossed` (cross margin) or `isolated` |
| `positionMode` | `one_way_mode` or `hedge_mode` |
| `autoMargin` | `on` or `off` |

**Example:**
```bash
bgc futures futures_update_config --productType USDT-FUTURES --symbol BTCUSDT --marginCoin USDT --setting positionMode --value hedge_mode
```

## Module: account

### `get_account_assets`

Get spot/futures/funding/all account balances. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `accountType` | string | No | `spot`, `futures`, `funding`, or `all` (default). Use `all` for a full overview. |
| `coin` | string | No | Filter to a specific coin, e.g. `USDT` |
| `productType` | string | No | Required when `accountType=futures`: `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |

> Run this before every trade to confirm available balance. Check `available` field — not `total` — for tradable amount.

**Example:**
```bash
bgc account get_account_assets
bgc account get_account_assets --accountType futures --productType USDT-FUTURES
bgc account get_account_assets --accountType spot --coin USDT
```

### `get_account_bills`

Get account bill records (trade history, fees, funding charges) for spot or futures account. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `accountType` | string | No | `spot` or `futures` |
| `coin` | string | No | Filter by coin, e.g. `USDT` |
| `productType` | string | No | Required when `accountType=futures`: `USDT-FUTURES`, `USDC-FUTURES`, or `COIN-FUTURES` |
| `businessType` | string | No | Filter by bill type, e.g. `trade`, `fee`, `funding` |
| `startTime` | string | No | Start time in milliseconds |
| `endTime` | string | No | End time in milliseconds |
| `limit` | number | No | Result size, default 100 |

**Example:**
```bash
bgc account get_account_bills --accountType futures --productType USDT-FUTURES
```

## Excluded Commands

The following account tools are NOT available in this skill.
Your virtual sub-account API key has no permission for these operations.

| Command | Reason |
|---------|--------|
| `transfer` | Sub-account has no transfer permission. Fund movements are user-controlled. |
| `withdraw` | No withdrawal permission by design — core security guarantee. |
| `cancel_withdrawal` | No withdrawal operations available. |
| `get_deposit_address` | Not needed for agent trading operations. |
| `get_transaction_records` | Not needed for agent trading operations. |
| `manage_subaccounts` | Not relevant to agent trading operations. |

> If `withdraw` appears callable, warn the user — they may be using a main-account API key.
