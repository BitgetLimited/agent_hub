# Bitget MCP Server - API Mapping

> Bitget REST API V2 → MCP Tool 完整映射表
> 
> 本文档说明每个 MCP Tool 对应的 Bitget REST API endpoint(s)，以及合并路由逻辑。

## Conventions

- **→** 表示 "maps to"
- **Routing logic** 说明同一个 tool 根据参数路由到不同 API endpoint 的策略
- **Merged** 表示多个 API endpoint 被合并为一个 MCP tool

---

## Module: spot

### Market Data (5 tools → 12 API endpoints)

| MCP Tool | Bitget API Endpoint(s) | Routing Logic |
|----------|----------------------|---------------|
| `spot_get_ticker` | `GET /api/v2/spot/market/tickers` | `symbol` 参数可选。有 symbol → 单个，无 → 全部（同一个 endpoint） |
| `spot_get_depth` | `GET /api/v2/spot/market/orderbook` | `type` 为 `"step0"` 或省略 → orderbook |
| | `GET /api/v2/spot/market/merge-depth` | `type` 为 `"step1"` - `"step5"` → merge-depth |
| `spot_get_candles` | `GET /api/v2/spot/market/candles` | 默认或近期数据 |
| | `GET /api/v2/spot/market/history-candles` | `startTime` 指向较早历史数据时自动路由 |
| `spot_get_trades` | `GET /api/v2/spot/market/fills` | 无 `startTime` → 最近成交 |
| | `GET /api/v2/spot/market/fills-history` | 有 `startTime` → 历史成交 |
| `spot_get_symbols` | `GET /api/v2/spot/public/symbols` | `type="symbols"` 或默认 |
| | `GET /api/v2/spot/public/coins` | `type="coins"` |

**Spot market data API endpoints NOT exposed as separate tools:**

| Bitget API | Reason | How to Access |
|------------|--------|---------------|
| `GET /api/v2/spot/market/vip-fee-rate` | 低频使用 | 可通过 `spot_get_symbols` 的扩展或后续版本添加 |
| `GET /api/v2/spot/market/whale-net-flow` | 低频使用 | 可在后续版本中作为 data analytics 模块添加 |
| `GET /api/v2/spot/market/fund-flow` | 低频使用 | 同上 |
| `GET /api/v2/spot/market/fund-net-flow` | 低频使用 | 同上 |
| `GET /api/v2/spot/market/support-symbols` | 低频使用 | 同上 |

---

### Trading (7 tools → 14 API endpoints)

| MCP Tool | Bitget API Endpoint(s) | Routing Logic |
|----------|----------------------|---------------|
| `spot_place_order` | `POST /api/v2/spot/trade/place-order` | `orders.length === 1` |
| | `POST /api/v2/spot/trade/batch-orders` | `orders.length > 1`（max 50） |
| `spot_cancel_orders` | `POST /api/v2/spot/trade/cancel-order` | `orderId` provided |
| | `POST /api/v2/spot/trade/batch-cancel-order` | `orderIds` provided |
| | `POST /api/v2/spot/trade/cancel-symbol-order` | `cancelAll=true` |
| `spot_modify_order` | `POST /api/v2/spot/trade/cancel-replace-order` | Always this endpoint |
| | `POST /api/v2/spot/trade/batch-cancel-replace-order` | Future: batch modify |
| `spot_get_orders` | `GET /api/v2/spot/trade/orderInfo` | `orderId` provided |
| | `GET /api/v2/spot/trade/unfilled-orders` | `status="open"` |
| | `GET /api/v2/spot/trade/history-orders` | `status="history"` |
| `spot_get_fills` | `GET /api/v2/spot/trade/fills` | Always this endpoint |
| `spot_place_plan_order` | `POST /api/v2/spot/trade/place-plan-order` | `orderId` absent → create |
| | `POST /api/v2/spot/trade/modify-plan-order` | `orderId` present → modify |
| `spot_get_plan_orders` | `GET /api/v2/spot/trade/current-plan-order` | `status="current"` |
| | `GET /api/v2/spot/trade/history-plan-order` | `status="history"` |
| `spot_cancel_plan_orders` | `POST /api/v2/spot/trade/cancel-plan-order` | `orderId` provided |
| | `POST /api/v2/spot/trade/batch-cancel-plan-order` | `orderIds` provided or `symbol` only |

**Spot trade API endpoints NOT mapped:**

| Bitget API | Reason |
|------------|--------|
| `GET /api/v2/spot/trade/plan-sub-order` | 极低频，计划委托子订单查询 |

---

## Module: futures

### Market Data (7 tools → 16 API endpoints)

| MCP Tool | Bitget API Endpoint(s) | Routing Logic |
|----------|----------------------|---------------|
| `futures_get_ticker` | `GET /api/v2/mix/market/ticker` | `symbol` provided |
| | `GET /api/v2/mix/market/tickers` | `symbol` omitted → all tickers |
| `futures_get_depth` | `GET /api/v2/mix/market/merge-depth` | Always this endpoint |
| `futures_get_candles` | `GET /api/v2/mix/market/candles` | `priceType="trade"` or default, recent |
| | `GET /api/v2/mix/market/history-candles` | `priceType="trade"`, historical |
| | `GET /api/v2/mix/market/history-index-candles` | `priceType="index"` |
| | `GET /api/v2/mix/market/history-mark-candles` | `priceType="mark"` |
| `futures_get_trades` | `GET /api/v2/mix/market/fills` | No `startTime` → recent |
| | `GET /api/v2/mix/market/fills-history` | Has `startTime` → history |
| `futures_get_contracts` | `GET /api/v2/mix/market/contracts` | Always this endpoint |
| `futures_get_funding_rate` | `GET /api/v2/mix/market/current-fund-rate` | `history=false` or default |
| | `GET /api/v2/mix/market/history-fund-rate` | `history=true` |
| | `GET /api/v2/mix/market/funding-time` | Also returned with `history=false` |
| `futures_get_open_interest` | `GET /api/v2/mix/market/open-interest` | Always this endpoint |

**Futures market API endpoints NOT mapped (data analytics, low frequency):**

| Bitget API | Description |
|------------|-------------|
| `GET /api/v2/mix/market/vip-fee-rate` | VIP 费率 |
| `GET /api/v2/mix/market/discount-rate` | 折扣率 |
| `GET /api/v2/mix/market/symbol-price` | 标记价格（ticker 已包含） |
| `GET /api/v2/mix/market/query-position-lever` | 仓位档位 |
| `GET /api/v2/mix/market/taker-buy-sell` | 主动买卖量 |
| `GET /api/v2/mix/market/position-long-short` | 多空持仓 |
| `GET /api/v2/mix/market/long-short-ratio` | 多空比 |
| `GET /api/v2/mix/market/account-long-short` | 多空账户数 |
| `GET /api/v2/mix/market/loan-growth` | 借贷增长率 |
| `GET /api/v2/mix/market/isolated-borrow-rate` | 逐仓借贷比率 |
| `GET /api/v2/mix/market/long-short` | 买卖量 |
| `GET /api/v2/mix/market/exchange-rate` | 汇率 |
| `GET /api/v2/mix/market/union-interest-rate-history` | 利率历史 |

> **Note**: These data analytics endpoints can be added as a separate `analytics` module in a future version.

---

### Trading (7 tools → 18 API endpoints)

| MCP Tool | Bitget API Endpoint(s) | Routing Logic |
|----------|----------------------|---------------|
| `futures_place_order` | `POST /api/v2/mix/order/place-order` | `orders.length === 1` |
| | `POST /api/v2/mix/order/batch-place-order` | `orders.length > 1` |
| `futures_cancel_orders` | `POST /api/v2/mix/order/cancel-order` | `orderId` provided |
| | `POST /api/v2/mix/order/batch-cancel-orders` | `orderIds` provided |
| | `POST /api/v2/mix/order/cancel-all-orders` | `cancelAll=true` |
| `futures_get_orders` | `GET /api/v2/mix/order/detail` | `orderId` provided |
| | `GET /api/v2/mix/order/orders-pending` | `status="open"` |
| | `GET /api/v2/mix/order/orders-history` | `status="history"` |
| `futures_get_fills` | `GET /api/v2/mix/order/fills` | Recent fills |
| | `GET /api/v2/mix/order/fill-history` | Historical fills (has startTime) |
| `futures_get_positions` | `GET /api/v2/mix/position/single-position` | `symbol` provided |
| | `GET /api/v2/mix/position/all-position` | `symbol` omitted |
| | `GET /api/v2/mix/position/history-position` | `history=true` |
| `futures_set_leverage` | `POST /api/v2/mix/account/set-leverage` | Always this endpoint |
| `futures_update_config` | `POST /api/v2/mix/account/set-margin-mode` | `setting="marginMode"` |
| | `POST /api/v2/mix/account/set-position-mode` | `setting="positionMode"` |
| | `POST /api/v2/mix/account/set-auto-margin` | `setting="autoMargin"` |

**Futures trade API endpoints NOT mapped:**

| Bitget API | Description | Reason |
|------------|-------------|--------|
| `POST /api/v2/mix/order/modify-order` | 修改订单 | 可在后续版本添加 |
| `POST /api/v2/mix/order/close-positions` | 闪电平仓 | 可在后续版本添加 |
| `POST /api/v2/mix/order/click-backhand` | 反手开仓 | 可在后续版本添加 |
| `POST /api/v2/mix/order/place-tpsl-order` | 独立 TPSL 单 | place_order 已内建 TP/SL 参数 |
| `POST /api/v2/mix/order/modify-tpsl-order` | 修改 TPSL | 可在后续版本添加 |
| `POST /api/v2/mix/order/place-plan-order` | 计划委托 | 可在后续版本添加 |
| `POST /api/v2/mix/order/modify-plan-order` | 修改计划委托 | 可在后续版本添加 |
| `GET /api/v2/mix/order/orders-plan-pending` | 当前计划委托 | 可在后续版本添加 |
| `GET /api/v2/mix/order/orders-plan-history` | 历史计划委托 | 可在后续版本添加 |
| `POST /api/v2/mix/order/cancel-plan-order` | 取消计划委托 | 可在后续版本添加 |
| `GET /api/v2/mix/order/plan-sub-order` | 计划委托子订单 | 可在后续版本添加 |
| `POST /api/v2/mix/account/set-margin` | 调整仓位保证金 | 可在后续版本添加 |
| `POST /api/v2/mix/account/set-asset-mode` | 设置资产模式 | 可在后续版本添加 |

> **Note**: Futures plan orders and advanced order types (TPSL, flash close, reversal) can be added as part of a `futures-advanced` sub-module in a future version.

---

## Module: account

### Account & Wallet (8 tools → 15+ API endpoints)

| MCP Tool | Bitget API Endpoint(s) | Routing Logic |
|----------|----------------------|---------------|
| `get_account_assets` | `GET /api/v2/account/all-account-balance` | `accountType="all"` or default |
| | `GET /api/v2/spot/account/assets` | `accountType="spot"` |
| | `GET /api/v2/mix/account/accounts` | `accountType="futures"` |
| | `GET /api/v2/account/funding-assets` | `accountType="funding"` |
| `get_account_bills` | `GET /api/v2/spot/account/bills` | `accountType="spot"` |
| | `GET /api/v2/mix/account/bill` | `accountType="futures"` |
| `transfer` | `POST /api/v2/spot/wallet/transfer` | No `subAccountUid` |
| | `POST /api/v2/spot/wallet/subaccount-transfer` | Has `subAccountUid` |
| `withdraw` | `POST /api/v2/spot/wallet/withdrawal` | Always this endpoint |
| `cancel_withdrawal` | `POST /api/v2/spot/wallet/cancel-withdrawal` | Always this endpoint |
| `get_deposit_address` | `GET /api/v2/spot/wallet/deposit-address` | Always this endpoint |
| `get_transaction_records` | `GET /api/v2/spot/wallet/deposit-records` | `recordType="deposit"` |
| | `GET /api/v2/spot/wallet/withdrawal-records` | `recordType="withdrawal"` |
| | `GET /api/v2/spot/account/transferRecords` | `recordType="transfer"` |
| `manage_subaccounts` | `POST /api/v2/user/create-virtual-subaccount` | `action="create"` |
| | `POST /api/v2/user/modify-virtual-subaccount` | `action="modify"` |
| | `GET /api/v2/user/virtual-subaccount-list` | `action="list"` |
| | `POST /api/v2/user/create-virtual-subaccount-apikey` | `action="createApiKey"` |
| | `POST /api/v2/user/modify-virtual-subaccount-apikey` | `action="modifyApiKey"` |
| | `GET /api/v2/user/virtual-subaccount-apikey-list` | `action="listApiKeys"` |

**Account API endpoints NOT mapped:**

| Bitget API | Reason |
|------------|--------|
| `GET /api/v2/spot/account/info` | 信息被 get_account_assets 覆盖 |
| `POST /api/v2/spot/wallet/modify-deposit-account` | 极低频 |
| `GET /api/v2/spot/wallet/transfer-coin-info` | 低频，可后续添加 |
| `GET /api/v2/spot/account/sub-main-trans-record` | 子账户划转记录，低频 |
| `POST /api/v2/spot/account/switch-deduct` | BGB 抵扣开关，低频 |
| `GET /api/v2/spot/account/deduct-info` | BGB 抵扣信息，低频 |
| `GET /api/v2/spot/wallet/subaccount-deposit-address` | 子账户充币地址，低频 |
| `GET /api/v2/spot/wallet/subaccount-deposit-records` | 子账户充币记录，低频 |
| `GET /api/v2/account/bot-assets` | 策略机器人资产，低频 |

---

## Module: margin

| MCP Tool | Bitget API Endpoint(s) | Routing Logic |
|----------|----------------------|---------------|
| `margin_get_assets` | `GET /api/v2/margin/crossed/account/assets` | `marginType="crossed"` |
| | `GET /api/v2/margin/isolated/account/assets` | `marginType="isolated"` |
| `margin_borrow` | `POST /api/v2/margin/crossed/account/borrow` | `marginType="crossed"` |
| | `POST /api/v2/margin/isolated/account/borrow` | `marginType="isolated"` |
| `margin_repay` | `POST /api/v2/margin/crossed/account/repay` | `marginType="crossed"`, no flash |
| | `POST /api/v2/margin/isolated/account/repay` | `marginType="isolated"`, no flash |
| | Flash repay endpoints | `flashRepay=true` |
| `margin_place_order` | `POST /api/v2/margin/crossed/order/place-order` | `marginType="crossed"` |
| | `POST /api/v2/margin/isolated/order/place-order` | `marginType="isolated"` |
| `margin_cancel_orders` | Cross/isolated cancel endpoints | By `marginType` |
| `margin_get_orders` | Cross/isolated order query endpoints | By `marginType` + `status` |
| `margin_get_records` | Borrow/repay/interest/liquidation record endpoints | By `marginType` + `recordType` |

---

## Module: convert

| MCP Tool | Bitget API Endpoint(s) | Routing Logic |
|----------|----------------------|---------------|
| `convert_get_quote` | `GET /api/v2/convert/currencies` | No `fromCoin` → list currencies |
| | `GET /api/v2/convert/quoted-price` | Has `fromCoin` → get quote |
| `convert_execute` | `POST /api/v2/convert/trade` | `type="normal"` or default |
| | `POST /api/v2/convert/bgb-convert` | `type="bgb"` |
| `convert_get_history` | `GET /api/v2/convert/convert-record` | `type="normal"` or default |
| | `GET /api/v2/convert/bgb-convert-records` | `type="bgb"` |

---

## Module: earn

| MCP Tool | Bitget API Endpoint(s) | Routing Logic |
|----------|----------------------|---------------|
| `earn_get_products` | Earn product listing endpoint | Always |
| `earn_subscribe_redeem` | Subscribe endpoint | `action="subscribe"` |
| | Redeem endpoint | `action="redeem"` |
| `earn_get_holdings` | Holdings query endpoint | Always |

---

## Module: p2p

| MCP Tool | Bitget API Endpoint(s) | Routing Logic |
|----------|----------------------|---------------|
| `p2p_get_merchants` | `GET /api/v2/p2p/merchantList` | No `merchantId` → list |
| | `GET /api/v2/p2p/merchantInfo` | Has `merchantId` → detail |
| `p2p_get_orders` | `GET /api/v2/p2p/orderList` | `type="orders"` or default |
| | `GET /api/v2/p2p/advList` | `type="advertisements"` |

---

## Module: broker

| MCP Tool | Bitget API Endpoint(s) | Routing Logic |
|----------|----------------------|---------------|
| `broker_get_info` | `GET /api/v2/broker/account/info` | Always |
| `broker_manage_subaccounts` | `POST /api/v2/broker/account/create-subaccount` | `action="create"` |
| | `POST /api/v2/broker/account/modify-subaccount` | `action="modify"` |
| | `GET /api/v2/broker/account/subaccount-list` | `action="list"` |
| `broker_manage_apikeys` | Broker API key management endpoints | By `action` |

---

## Coverage Summary

| Category | Total Bitget V2 Endpoints | Mapped in MCP | Coverage | Unmapped Reason |
|----------|--------------------------|---------------|----------|-----------------|
| Common / Public | 3 | 0 | 0% | server_time 等可后续添加 |
| Spot Market | 12 | 7 (→ 5 tools) | 58% | 数据分析类后续版本 |
| Spot Trade | 15 | 14 (→ 7 tools) | 93% | plan-sub-order 极低频 |
| Spot Account | 18 | 12 (→ 5 tools) | 67% | BGB 抵扣等低频 |
| Futures Market | 20 | 9 (→ 7 tools) | 45% | 数据分析类后续版本 |
| Futures Trade | 15 | 10 (→ 5 tools) | 67% | 计划委托/高级单后续版本 |
| Futures Account | 15 | 6 (→ 2 tools) | 40% | 高级配置后续版本 |
| Margin | ~15 | ~14 (→ 7 tools) | 93% | — |
| Copy Trading | ~10 | ~10 (→ 5 tools) | 100% | — |
| Convert | 7 | 7 (→ 3 tools) | 100% | — |
| Earn | ~5 | ~5 (→ 3 tools) | 100% | — |
| P2P | 4 | 4 (→ 2 tools) | 100% | — |
| Broker | ~8 | ~8 (→ 3 tools) | 100% | — |
| Tax | 4 | 0 | 0% | 可归入 account 模块 |
| Subaccount | 6 | 6 (→ 1 tool) | 100% | 合并到 manage_subaccounts |

**Overall: ~57 MCP tools covering ~80%+ of high-frequency Bitget API usage scenarios.**

---

## Future Expansion Plan

| Version | New Module/Tools | Endpoints Added |
|---------|-----------------|-----------------|
| v1.1 | `analytics` module | 多空比、鲸鱼流入、资金流向等 data analytics endpoints |
| v1.1 | `tax` module | 4 个税务记录 endpoints |
| v1.2 | Futures advanced | 计划委托、TPSL 独立单、闪电平仓、反手开仓 |
| v1.2 | `get_server_time` | 公共时间同步 |
| v1.3 | Futures account advanced | 调整仓位保证金、资产模式、统一账户配置 |
