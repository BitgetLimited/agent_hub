# Mock Server Design

**Date:** 2026-03-03
**Branch:** feature/skills
**Scope:** `packages/bitget-test-utils` — stateful HTTP mock server + Vitest test suites for all packages.

---

## Goals

Enable full functional testing of all three consumers (bitget-core tools, bitget-mcp MCP server, bitget-client CLI) without calling the real Bitget API. The mock server supports both automated CI tests and standalone manual exploration.

---

## Architecture

All three consumers go through `BitgetRestClient.request()` which calls `fetch(config.baseUrl + path, ...)`. The mock only needs to intercept HTTP — no MCP protocol mocking required. Setting `BITGET_API_BASE_URL=http://localhost:PORT` is sufficient to redirect all traffic.

**New package:** `packages/bitget-test-utils` (private, workspace-only)

```
packages/bitget-test-utils/
├── src/
│   ├── index.ts                  # Public exports: MockServer, MockState, seed helpers
│   ├── server/
│   │   ├── mock-server.ts        # HTTP server: start/stop, port management
│   │   ├── router.ts             # Route dispatch: method + path → handler
│   │   ├── state.ts              # In-memory state store + reset()
│   │   ├── fixtures.ts           # Default fixture data (symbols, tickers, balances)
│   │   └── routes/
│   │       ├── spot-market.ts    # GET /api/v2/spot/market/*
│   │       ├── spot-trade.ts     # POST/GET /api/v2/spot/trade/*
│   │       ├── futures-market.ts # GET /api/v2/mix/market/*
│   │       ├── futures-trade.ts  # POST/GET /api/v2/mix/order/*, /api/v2/mix/position/*, /api/v2/mix/account/*
│   │       ├── account.ts        # /api/v2/spot/account/*, /api/v2/spot/wallet/*, /api/v2/account/*, /api/v2/user/*
│   │       ├── margin.ts         # /api/v2/margin/*
│   │       ├── copy-trading.ts   # /api/v2/copy/*
│   │       ├── convert.ts        # /api/v2/convert/*
│   │       ├── earn.ts           # /api/v2/earn/*
│   │       ├── p2p.ts            # /api/v2/p2p/*
│   │       └── broker.ts         # /api/v2/broker/*
│   └── bin/
│       └── mock-server.ts        # CLI: `bitget-mock-server --port 3210`
├── package.json
└── tsconfig.json
```

---

## In-Memory State Store

Single object, reset between tests via `reset()`. Re-seeds fixture defaults on every reset.

```ts
interface MockState {
  // Spot
  spotOrders: Map<string, SpotOrder>;
  spotPlanOrders: Map<string, SpotPlanOrder>;

  // Futures
  futuresOrders: Map<string, FuturesOrder>;
  positions: Map<string, Position>;         // key: `${symbol}:${holdSide}`
  leverage: Map<string, number>;            // key: symbol

  // Account
  balances: Map<string, Balance>;           // key: coin
  transfers: Transfer[];
  withdrawals: Map<string, Withdrawal>;
  deposits: Deposit[];
  subaccounts: Map<string, Subaccount>;

  // Margin
  marginOrders: Map<string, MarginOrder>;
  marginPositions: Map<string, MarginPosition>;

  // Convert
  convertQuotes: Map<string, ConvertQuote>; // key: quoteId
  convertHistory: ConvertRecord[];

  // Earn
  earnProducts: EarnProduct[];
  earnHoldings: Map<string, EarnHolding>;

  // P2P
  p2pOrders: Map<string, P2pOrder>;

  // Broker
  brokerSubaccounts: Map<string, BrokerSubaccount>;

  // Copy trading
  copyTradingSettings: Map<string, CopySettings>;

  // Error injection
  errorOverrides: Map<string, { code: string; msg: string }>;  // key: `METHOD /path`
}
```

**Fixture seeds (applied on every `reset()`):**
- Spot symbols: `BTCUSDT` (lastPr: `"50000"`), `ETHUSDT` (`"3000"`), `SOLUSDT` (`"150"`)
- Futures contracts: `BTCUSDT` (productType: `usdt-futures`), `ETHUSDT`
- Balances: `USDT: 10000`, `BTC: 1.0`, `ETH: 10.0`
- Earn products: 2 flexible savings, 3 fixed-term products

**Key state transitions:**
- `spot_place_order` → inserts into `spotOrders` (status: `"live"`), deducts from `balances`
- `spot_cancel_orders` → sets status `"cancelled"`, refunds `balances`
- `spot_get_orders` → reads `spotOrders` filtered by status/symbol
- `futures_place_order` → inserts into `futuresOrders`, creates/updates `positions`
- `account_get_balance` → reads `balances`
- Same state-transition pattern mirrors for all write tools

---

## HTTP Server & Routing

**`MockServer` class:**

```ts
class MockServer {
  constructor(initialState?: Partial<MockState>)

  start(port?: number): Promise<number>     // returns bound port (random if 0)
  stop(): Promise<void>
  reset(): void                             // wipe state, re-seed fixtures

  getState(): MockState
  setState(patch: Partial<MockState>): void
  seedOrder(order: Partial<SpotOrder>): string   // returns generated orderId
}
```

**Response envelope:** All responses wrap in `{ code: "00000", msg: "success", data: result }`.

**Auth validation:** Private endpoints check presence of `ACCESS-KEY`, `ACCESS-SIGN`, `ACCESS-PASSPHRASE`, `ACCESS-TIMESTAMP` headers. HMAC is not verified. Missing headers return `{ code: "40017", msg: "Invalid API key" }`.

**Error injection:**

```ts
server.setState({
  errorOverrides: new Map([
    ["POST /api/v2/spot/trade/place-order", { code: "40786", msg: "Insufficient balance" }]
  ])
});
```

**Standalone CLI:** `bitget-mock-server --port 3210` starts the server, prints the base URL, runs until killed. Users set `BITGET_API_BASE_URL=http://localhost:3210` for manual `bgc` or MCP server testing.

---

## Test Suite Structure

Tests use Vitest. Mock server starts once per suite (`beforeAll`), resets between tests (`beforeEach`).

**`packages/bitget-core/tests/`**

```
tests/
├── tools/
│   ├── spot-market.test.ts      # spot_get_ticker, spot_get_depth, spot_get_candles, spot_get_trades, spot_get_symbols
│   ├── spot-trade.test.ts       # spot_place_order, spot_cancel_orders, spot_get_orders, spot_get_fills, spot_place_plan_order
│   ├── futures-market.test.ts   # futures_get_ticker, futures_get_depth, futures_get_candles, futures_get_contracts, futures_get_funding_rate
│   ├── futures-trade.test.ts    # futures_place_order, futures_cancel_orders, futures_get_orders, futures_get_positions, futures_set_leverage
│   ├── account.test.ts          # account_get_balance, account_transfer, account_get_subaccounts
│   ├── margin.test.ts
│   ├── copy-trading.test.ts
│   ├── convert.test.ts
│   ├── earn.test.ts
│   ├── p2p.test.ts
│   └── broker.test.ts
└── client/
    ├── rest-client.test.ts      # auth headers, error parsing, network error, timeout
    └── errors.test.ts           # toToolErrorPayload shape verification
```

**`packages/bitget-mcp/tests/`**

```
tests/
└── server.test.ts   # list_tools, call_tool success, call_tool error, system_get_capabilities, unknown tool
```

**`packages/bitget-client/tests/`**

```
tests/
└── cli.test.ts      # arg parsing, stdout JSON output, stderr on error, exit codes
```

---

## Package Config

**`packages/bitget-test-utils/package.json`:**

```json
{
  "name": "bitget-test-utils",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "bitget-mock-server": "./dist/bin/mock-server.js"
  },
  "scripts": {
    "build": "tsup src/index.ts src/bin/mock-server.ts --format esm --dts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "bitget-core": "workspace:*"
  }
}
```

**Each consumer package adds:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "bitget-test-utils": "workspace:*",
    "vitest": "^2.0.0"
  }
}
```

**Root `package.json`:**

```json
"test": "pnpm -r run test"
```

---

## Non-goals

- No HMAC signature verification (presence check only)
- No WebSocket/streaming support
- No persistence between process restarts
- No rate-limit enforcement in the mock (rate limiter is tested via unit tests on `RateLimiter` directly)
- No version bumps to published packages
