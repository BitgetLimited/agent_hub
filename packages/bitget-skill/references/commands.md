# bgc Command Reference

Auto-generated from bitget-core tool definitions.

## Usage

```
bgc <module> <tool_name> [--param value ...]
```

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

### `spot_place_order`

Place one or more spot orders. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orders` | array | Yes | Array of order objects. Single order should still be passed as an array with one item. |

**Example:**
```bash
bgc spot spot_place_order --orders <value>
```

### `spot_cancel_orders`

Cancel one or more spot orders by id, batch ids, or symbol-wide cancel. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

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

### `spot_modify_order`

Cancel and replace a spot order atomically. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

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
| `symbol` | string | No | Trading pair symbol. |
| `orderId` | string | No | Specific order id. |
| `startTime` | string | No | Start time in milliseconds. |
| `endTime` | string | No | End time in milliseconds. |
| `limit` | number | No | Result size, default 100. |

**Example:**
```bash
bgc spot spot_get_fills --symbol <value> --orderId <value>
```

### `spot_place_plan_order`

Create or modify spot plan order (trigger order). Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

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
| `symbol` | string | No | Trading pair symbol. |
| `status` | string | No | current(default) or history. |
| `startTime` | string | No | Start time in milliseconds. |
| `endTime` | string | No | End time in milliseconds. |
| `limit` | number | No | Result size, default 100. |

**Example:**
```bash
bgc spot spot_get_plan_orders --symbol <value> --status <value>
```

### `spot_cancel_plan_orders`

Cancel one or multiple spot plan orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string | No | Single plan order id. |
| `symbol` | string | No | Cancel all plan orders for symbol. |

**Example:**
```bash
bgc spot spot_cancel_plan_orders --orderId <value> --symbol <value>
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

### `futures_place_order`

Place one or more futures orders with optional TP/SL. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orders` | array | Yes | Array of futures order objects. |

**Example:**
```bash
bgc futures futures_place_order --orders <value>
```

### `futures_cancel_orders`

Cancel futures orders by order id, batch ids, or cancel-all mode. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

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

### `futures_set_leverage`

Set futures leverage for symbol and margin coin. [CAUTION] Affects risk exposure. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — requires confirmation

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

### `futures_update_config`

Update futures margin mode, position mode, or auto-margin setting. [CAUTION] Affects trading behavior. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — requires confirmation

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

### `transfer`

Transfer funds between accounts or sub-account. [CAUTION] Moves funds. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `fromAccountType` | string | Yes |  |
| `toAccountType` | string | Yes |  |
| `coin` | string | Yes |  |
| `amount` | string | Yes |  |
| `subAccountUid` | string | No |  |
| `fromUserId` | string | No | Sub-account user ID (sender). If omitted, subAccountUid is used as fallback. |
| `toUserId` | string | No | Sub-account user ID (recipient). |
| `symbol` | string | No |  |
| `clientOid` | string | No |  |

**Example:**
```bash
bgc account transfer --fromAccountType <value> --toAccountType <value>
```

### `withdraw`

Withdraw funds to external address. [DANGER] Irreversible fund movement. Private endpoint. Rate limit: 1 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coin` | string | Yes |  |
| `transferType` | string | Yes |  |
| `address` | string | Yes |  |
| `chain` | string | No |  |
| `amount` | string | Yes |  |
| `tag` | string | No |  |
| `clientOid` | string | No |  |

**Example:**
```bash
bgc account withdraw --coin <value> --transferType <value>
```

### `cancel_withdrawal`

Cancel pending withdrawal request by order id. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string | Yes | Withdrawal order id. |

**Example:**
```bash
bgc account cancel_withdrawal --orderId <value>
```

### `get_deposit_address`

Get deposit address for coin and optional chain. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coin` | string | Yes |  |
| `chain` | string | No |  |

**Example:**
```bash
bgc account get_deposit_address --coin <value> --chain <value>
```

### `get_transaction_records`

Get deposit, withdrawal, or transfer records. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `recordType` | string | Yes |  |
| `coin` | string | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |
| `limit` | number | No |  |
| `orderId` | string | No |  |

**Example:**
```bash
bgc account get_transaction_records --recordType <value> --coin <value>
```

### `manage_subaccounts`

Create, modify, list subaccounts and manage subaccount API keys. [CAUTION] Account management operation. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | string | Yes |  |
| `subAccountName` | string | No |  |
| `subAccountUid` | string | No |  |
| `remark` | string | No |  |
| `permList` | array | No | Permission list (required for modify, createApiKey, modifyApiKey). |
| `status` | string | No | Sub-account status (required for modify). |
| `apiKeyPermissions` | string | No | Single permission string (backward compat; prefer permList). |
| `apiKeyIp` | string | No | Single IP string (backward compat; prefer ipList). |
| `apiKeyPassphrase` | string | No |  |
| `label` | string | No | API key label (required for createApiKey/modifyApiKey). |
| `subAccountApiKey` | string | No | The API key to modify (required for modifyApiKey). |

**Example:**
```bash
bgc account manage_subaccounts --action <value> --subAccountName <value>
```

## Module: margin

### `margin_get_assets`

Get crossed or isolated margin assets and risk metrics. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes |  |
| `symbol` | string | No |  |
| `coin` | string | No |  |

**Example:**
```bash
bgc margin margin_get_assets --marginType <value> --symbol <value>
```

### `margin_borrow`

Borrow margin funds. [CAUTION] Creates debt. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes |  |
| `coin` | string | Yes |  |
| `amount` | string | Yes |  |
| `symbol` | string | No | Required for isolated margin. |

**Example:**
```bash
bgc margin margin_borrow --marginType <value> --coin <value>
```

### `margin_repay`

Repay margin debt with optional flash repay. [CAUTION] Uses account funds. Private endpoint. Rate limit: 10 req/s per UID. For flash repay, coin is optional (omit to repay all). For isolated flash repay, symbol filters which pairs to repay.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes |  |
| `coin` | string | No | Required for regular repay. Optional for flash repay (omit to repay all). |
| `amount` | string | No | Required for regular repay. |
| `symbol` | string | No | Required for isolated regular repay. Optional for isolated flash repay. |
| `flashRepay` | boolean | No |  |

**Example:**
```bash
bgc margin margin_repay --marginType <value> --coin <value>
```

### `margin_place_order`

Place margin order in crossed or isolated mode. [CAUTION] Executes real trade. Private endpoint. Rate limit: 10 req/s per UID. For market buy orders, use quoteSize (quote currency amount) instead of size.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes |  |
| `symbol` | string | Yes |  |
| `side` | string | Yes |  |
| `orderType` | string | Yes |  |
| `price` | string | No |  |
| `size` | string | No | Base currency size. For market buy, use quoteSize instead. |
| `quoteSize` | string | No | Quote currency size. Required for market buy orders. |
| `loanType` | string | No |  |

**Example:**
```bash
bgc margin margin_place_order --marginType <value> --symbol <value>
```

### `margin_cancel_orders`

Cancel one or more margin orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes |  |
| `symbol` | string | Yes |  |
| `orderId` | string | No |  |
| `orderIds` | array | No |  |

**Example:**
```bash
bgc margin margin_cancel_orders --marginType <value> --symbol <value>
```

### `margin_get_orders`

Query margin orders (open/history/order detail). Private endpoint. Rate limit: 10 req/s per UID. Note: symbol and startTime are required by the API for open-orders queries.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes |  |
| `symbol` | string | No | Required for open-orders queries per API docs. |
| `orderId` | string | No |  |
| `status` | string | No |  |
| `startTime` | string | No | Required for open-orders queries per API docs. |
| `endTime` | string | No |  |
| `limit` | number | No |  |

**Example:**
```bash
bgc margin margin_get_orders --marginType <value> --symbol <value>
```

### `margin_get_records`

Get borrow/repay/interest/liquidation records for margin accounts. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `marginType` | string | Yes |  |
| `recordType` | string | Yes |  |
| `coin` | string | No |  |
| `symbol` | string | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |
| `limit` | number | No |  |

**Example:**
```bash
bgc margin margin_get_records --marginType <value> --recordType <value>
```

## Module: copytrading

### `copy_get_traders`

Get copy-trading trader list and configuration candidates. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | No | Copy trading market type. |
| `symbol` | string | No | Optional symbol filter for spot copy. |
| `limit` | number | No | Page size, default 20. |

**Example:**
```bash
bgc copytrading copy_get_traders --productType <value> --symbol <value>
```

### `copy_place_order`

Create or update copy-trading follow settings. [CAUTION] Changes copy-trading behavior. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `traderId` | string | No | Required trader id. |
| `symbol` | string | No | Symbol for copy settings. |
| `leverageType` | string | No | Futures copy leverage type. Default position. |
| `traceType` | string | No | Copy size mode. Default amount. |
| `marginType` | string | No | Futures margin type. Default trader. |
| `amount` | string | No | Trace amount/value (mapped to traceValue). |
| `ratio` | string | No | Trace ratio (mapped to traceValue when traceType=ratio). |
| `maxHoldSize` | string | No | Max hold size for spot copy settings. |
| `autoSelectTrader` | boolean | No | When true (or traderId omitted), auto-select trader from query-traders list. |
| `selectionPolicy` | string | No | Trader auto-selection policy. Default recommended. |
| `dryRun` | boolean | No | When true, resolve trader and return payload preview without sending write request. |

**Example:**
```bash
bgc copytrading copy_place_order --productType <value> --traderId <value>
```

### `copy_close_position`

Close copy-trading follower position (futures). [CAUTION] Closes positions. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | Yes |  |
| `subPosId` | string | No | Tracking number (maps to trackingNo). |
| `marginCoin` | string | No |  |
| `marginMode` | string | No |  |
| `holdSide` | string | No |  |

**Example:**
```bash
bgc copytrading copy_close_position --productType <value> --symbol <value>
```

### `copy_get_orders`

Query copy-trading historical orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |
| `limit` | number | No |  |
| `traderId` | string | No | Optional trader id filter. |

**Example:**
```bash
bgc copytrading copy_get_orders --productType <value> --symbol <value>
```

### `copy_get_positions`

Get current or historical copy-trading positions/orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes |  |
| `symbol` | string | No |  |
| `history` | boolean | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |
| `limit` | number | No |  |
| `traderId` | string | No |  |

**Example:**
```bash
bgc copytrading copy_get_positions --productType <value> --symbol <value>
```

## Module: convert

### `convert_get_quote`

Get supported convert currencies or quoted conversion price. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `fromCoin` | string | No |  |
| `toCoin` | string | No |  |
| `fromCoinAmount` | string | No |  |
| `toCoinAmount` | string | No |  |

**Example:**
```bash
bgc convert convert_get_quote --fromCoin <value> --toCoin <value>
```

### `convert_execute`

Execute normal conversion or BGB small balance sweep. [CAUTION] Converts funds. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | string | No |  |
| `fromCoin` | string | Yes |  |
| `toCoin` | string | Yes |  |
| `fromCoinAmount` | string | No |  |
| `toCoinAmount` | string | No |  |
| `traceId` | string | No |  |
| `coinList` | array | No |  |

**Example:**
```bash
bgc convert convert_execute --type <value> --fromCoin <value>
```

### `convert_get_history`

Get conversion or BGB sweep history. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | string | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |
| `limit` | number | No |  |

**Example:**
```bash
bgc convert convert_get_history --type <value> --startTime <value>
```

## Module: earn

### `earn_get_products`

Query available earn products such as savings and staking. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coin` | string | No |  |
| `filter` | string | No |  |

**Example:**
```bash
bgc earn earn_get_products --coin <value> --filter <value>
```

### `earn_subscribe_redeem`

Subscribe or redeem earn products. [CAUTION] Locks/releases funds. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | string | Yes |  |
| `productId` | string | Yes |  |
| `amount` | string | Yes |  |
| `periodType` | string | Yes |  |
| `orderId` | string | No |  |

**Example:**
```bash
bgc earn earn_subscribe_redeem --action <value> --productId <value>
```

### `earn_get_holdings`

Get current earn holdings and earnings records. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coin` | string | No |  |
| `periodType` | string | Yes |  |

**Example:**
```bash
bgc earn earn_get_holdings --coin <value> --periodType <value>
```

## Module: p2p

### `p2p_get_merchants`

Get P2P merchant list or specific merchant details. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `merchantId` | string | No |  |

**Example:**
```bash
bgc p2p p2p_get_merchants --merchantId <value>
```

### `p2p_get_orders`

Get P2P order list or advertisement list. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | string | No | orders(default) or advertisements. |
| `status` | string | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |
| `side` | string | No | Required for advertisements: buy or sell. |
| `coin` | string | No | Required for advertisements: coin to trade. |
| `fiat` | string | No | Required for advertisements: fiat currency. |

**Example:**
```bash
bgc p2p p2p_get_orders --type <value> --status <value>
```

## Module: broker

### `broker_get_info`

Get broker account information and commission data. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Example:**
```bash
bgc broker broker_get_info
```

### `broker_manage_subaccounts`

Create, modify, or list broker subaccounts. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | string | Yes |  |
| `subAccountUid` | string | No |  |
| `subAccountName` | string | No |  |
| `permList` | array | No |  |
| `status` | string | No |  |
| `limit` | number | No |  |
| `idLessThan` | string | No |  |
| `startTime` | string | No |  |
| `endTime` | string | No |  |

**Example:**
```bash
bgc broker broker_manage_subaccounts --action <value> --subAccountUid <value>
```

### `broker_manage_apikeys`

Create, modify, list, or delete API keys for broker subaccounts. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — requires confirmation

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | string | Yes |  |
| `subAccountUid` | string | Yes |  |
| `apiKeyPermissions` | string | No |  |
| `apiKeyIp` | string | No |  |
| `apiKeyPassphrase` | string | No |  |
| `label` | string | No |  |
| `permType` | string | No |  |
| `apiKey` | string | No |  |

**Example:**
```bash
bgc broker broker_manage_apikeys --action <value> --subAccountUid <value>
```
