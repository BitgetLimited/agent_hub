# Mock Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `packages/bitget-test-utils` — a stateful HTTP mock server for all 58 Bitget tools plus Vitest test suites for bitget-core, bitget-mcp, and bitget-client.

**Architecture:** Real `node:http` server on a random port. All consumers redirect via `BITGET_API_BASE_URL`. In-memory state store tracks orders/positions/balances; reset between tests. Tests live in each consumer package's `tests/` directory.

**Tech Stack:** TypeScript, Node.js `node:http`, Vitest 2.x, tsup, pnpm workspaces

---

### Task 1: Scaffold `packages/bitget-test-utils`

**Files:**
- Create: `packages/bitget-test-utils/package.json`
- Create: `packages/bitget-test-utils/tsconfig.json`
- Create: `packages/bitget-test-utils/tsup.config.ts`
- Modify: `pnpm-workspace.yaml` (already includes `packages/*` glob — no change needed)
- Modify: `package.json` (root) — add `"test": "pnpm -r run test"`

**Step 1: Create `packages/bitget-test-utils/package.json`**

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
    "build": "tsup",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "bitget-core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.6.0"
  }
}
```

**Step 2: Create `packages/bitget-test-utils/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

Check that `tsconfig.base.json` exists at the repo root. If not, copy from `packages/bitget-core/tsconfig.json` and adapt (remove `outDir`, `rootDir`).

**Step 3: Create `packages/bitget-test-utils/tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/bin/mock-server.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
});
```

**Step 4: Add test script to root `package.json`**

In the root `package.json` `scripts` section, add:
```json
"test": "pnpm -r run test"
```

**Step 5: Install dependencies**

```bash
cd packages/bitget-test-utils && pnpm install
```

Expected: resolves `bitget-core` from workspace.

**Step 6: Verify workspace resolves**

```bash
cd /repo-root && pnpm install
```

Expected: no errors, `bitget-test-utils` appears in workspace.

**Step 7: Commit**

```bash
git add packages/bitget-test-utils/package.json packages/bitget-test-utils/tsconfig.json packages/bitget-test-utils/tsup.config.ts package.json
git commit -m "chore: scaffold bitget-test-utils package"
```

---

### Task 2: State store and fixtures

**Files:**
- Create: `packages/bitget-test-utils/src/server/state.ts`
- Create: `packages/bitget-test-utils/src/server/fixtures.ts`

**Step 1: Create `packages/bitget-test-utils/src/server/state.ts`**

```ts
export interface SpotOrder {
  orderId: string;
  clientOid?: string;
  symbol: string;
  side: string;
  orderType: string;
  price?: string;
  size: string;
  status: "live" | "filled" | "cancelled" | "partially_filled";
  fillSize: string;
  fillPrice?: string;
  cTime: string;
  uTime: string;
}

export interface SpotPlanOrder {
  orderId: string;
  symbol: string;
  side: string;
  orderType: string;
  triggerPrice: string;
  triggerType: string;
  size: string;
  status: "live" | "filled" | "cancelled";
  cTime: string;
}

export interface FuturesOrder {
  orderId: string;
  clientOid?: string;
  symbol: string;
  productType: string;
  side: string;
  tradeSide: string;
  orderType: string;
  price?: string;
  size: string;
  status: "live" | "filled" | "cancelled";
  cTime: string;
  uTime: string;
}

export interface Position {
  symbol: string;
  productType: string;
  holdSide: "long" | "short";
  total: string;
  available: string;
  averageOpenPrice: string;
  unrealizedPL: string;
  leverage: string;
}

export interface Balance {
  coin: string;
  available: string;
  frozen: string;
}

export interface Transfer {
  transferId: string;
  coin: string;
  size: string;
  fromType: string;
  toType: string;
  cTime: string;
}

export interface Withdrawal {
  withdrawalId: string;
  coin: string;
  size: string;
  address: string;
  status: "pending" | "processing" | "success" | "cancelled";
  cTime: string;
}

export interface Deposit {
  depositId: string;
  coin: string;
  size: string;
  address: string;
  status: "pending" | "success";
  cTime: string;
}

export interface Subaccount {
  subUid: string;
  subName: string;
  status: "normal" | "freeze";
}

export interface MarginOrder {
  orderId: string;
  symbol: string;
  side: string;
  orderType: string;
  price?: string;
  size: string;
  status: "live" | "filled" | "cancelled";
  cTime: string;
}

export interface MarginPosition {
  symbol: string;
  side: "long" | "short";
  size: string;
  leverage: string;
}

export interface ConvertQuote {
  quoteId: string;
  fromCoin: string;
  toCoin: string;
  fromSize: string;
  toSize: string;
  price: string;
  expireTime: string;
}

export interface ConvertRecord {
  tradeId: string;
  fromCoin: string;
  toCoin: string;
  fromSize: string;
  toSize: string;
  status: "success";
  cTime: string;
}

export interface EarnProduct {
  productId: string;
  coin: string;
  productType: "flexible" | "fixed";
  apy: string;
  minAmount: string;
  term?: number;
}

export interface EarnHolding {
  holdingId: string;
  productId: string;
  coin: string;
  size: string;
  status: "holding" | "redeemed";
}

export interface P2pOrder {
  orderId: string;
  type: "buy" | "sell";
  coin: string;
  fiatCoin: string;
  fiatAmount: string;
  status: "pending" | "completed" | "cancelled";
  cTime: string;
}

export interface BrokerSubaccount {
  subUid: string;
  subName: string;
  status: "normal" | "freeze";
}

export interface CopySettings {
  traderId: string;
  mode: "spot" | "mix";
  copyAmount?: string;
  stopLoss?: string;
}

export interface MockState {
  spotOrders: Map<string, SpotOrder>;
  spotPlanOrders: Map<string, SpotPlanOrder>;
  futuresOrders: Map<string, FuturesOrder>;
  positions: Map<string, Position>;
  leverage: Map<string, number>;
  balances: Map<string, Balance>;
  transfers: Transfer[];
  withdrawals: Map<string, Withdrawal>;
  deposits: Deposit[];
  subaccounts: Map<string, Subaccount>;
  marginOrders: Map<string, MarginOrder>;
  marginPositions: Map<string, MarginPosition>;
  convertQuotes: Map<string, ConvertQuote>;
  convertHistory: ConvertRecord[];
  earnProducts: EarnProduct[];
  earnHoldings: Map<string, EarnHolding>;
  p2pOrders: Map<string, P2pOrder>;
  brokerSubaccounts: Map<string, BrokerSubaccount>;
  copyTradingSettings: Map<string, CopySettings>;
  errorOverrides: Map<string, { code: string; msg: string }>;
}

let _idCounter = 1;
export function nextId(prefix: string): string {
  return `${prefix}${String(_idCounter++).padStart(10, "0")}`;
}

export function createEmptyState(): MockState {
  return {
    spotOrders: new Map(),
    spotPlanOrders: new Map(),
    futuresOrders: new Map(),
    positions: new Map(),
    leverage: new Map(),
    balances: new Map(),
    transfers: [],
    withdrawals: new Map(),
    deposits: [],
    subaccounts: new Map(),
    marginOrders: new Map(),
    marginPositions: new Map(),
    convertQuotes: new Map(),
    convertHistory: [],
    earnProducts: [],
    earnHoldings: new Map(),
    p2pOrders: new Map(),
    brokerSubaccounts: new Map(),
    copyTradingSettings: new Map(),
    errorOverrides: new Map(),
  };
}
```

**Step 2: Create `packages/bitget-test-utils/src/server/fixtures.ts`**

```ts
import type { MockState } from "./state.js";

export const SPOT_TICKERS: Record<string, { lastPr: string; bidPr: string; askPr: string; change24h: string }> = {
  BTCUSDT: { lastPr: "50000", bidPr: "49999", askPr: "50001", change24h: "0.02" },
  ETHUSDT: { lastPr: "3000",  bidPr: "2999",  askPr: "3001",  change24h: "0.01" },
  SOLUSDT: { lastPr: "150",   bidPr: "149.9", askPr: "150.1", change24h: "-0.005" },
};

export const FUTURES_TICKERS: Record<string, { lastPr: string; bidPr: string; askPr: string; fundingRate: string; productType: string }> = {
  BTCUSDT: { lastPr: "50100", bidPr: "50099", askPr: "50101", fundingRate: "0.0001", productType: "usdt-futures" },
  ETHUSDT: { lastPr: "3010",  bidPr: "3009",  askPr: "3011",  fundingRate: "0.00008", productType: "usdt-futures" },
};

export function seedState(state: MockState): void {
  // Default balances
  state.balances.set("USDT", { coin: "USDT", available: "10000", frozen: "0" });
  state.balances.set("BTC",  { coin: "BTC",  available: "1",     frozen: "0" });
  state.balances.set("ETH",  { coin: "ETH",  available: "10",    frozen: "0" });

  // Default earn products
  state.earnProducts = [
    { productId: "earn001", coin: "USDT", productType: "flexible", apy: "0.05",  minAmount: "10" },
    { productId: "earn002", coin: "BTC",  productType: "flexible", apy: "0.02",  minAmount: "0.001" },
    { productId: "earn003", coin: "USDT", productType: "fixed",    apy: "0.08",  minAmount: "100", term: 30 },
    { productId: "earn004", coin: "ETH",  productType: "fixed",    apy: "0.04",  minAmount: "0.1", term: 14 },
    { productId: "earn005", coin: "USDT", productType: "fixed",    apy: "0.12",  minAmount: "1000", term: 90 },
  ];
}
```

**Step 3: Typecheck**

```bash
cd packages/bitget-test-utils && pnpm typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add packages/bitget-test-utils/src/server/state.ts packages/bitget-test-utils/src/server/fixtures.ts
git commit -m "feat(test-utils): add MockState types and fixture seeds"
```

---

### Task 3: HTTP server core + router

**Files:**
- Create: `packages/bitget-test-utils/src/server/router.ts`
- Create: `packages/bitget-test-utils/src/server/mock-server.ts`

**Step 1: Create `packages/bitget-test-utils/src/server/router.ts`**

```ts
import type { IncomingMessage, ServerResponse } from "node:http";
import type { MockState } from "./state.js";

export type RouteHandler = (
  req: IncomingMessage,
  body: Record<string, unknown>,
  query: URLSearchParams,
  state: MockState,
) => unknown;

export class Router {
  private routes = new Map<string, RouteHandler>();

  register(method: string, path: string, handler: RouteHandler): void {
    this.routes.set(`${method.toUpperCase()} ${path}`, handler);
  }

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    state: MockState,
  ): Promise<void> {
    const rawUrl = req.url ?? "/";
    const urlObj = new URL(rawUrl, "http://localhost");
    const path = urlObj.pathname;
    const query = urlObj.searchParams;
    const method = (req.method ?? "GET").toUpperCase();
    const key = `${method} ${path}`;

    // Check error overrides
    const override = state.errorOverrides.get(key);
    if (override) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: override.code, msg: override.msg, data: null }));
      return;
    }

    // Auth check for private endpoints (heuristic: has ACCESS-KEY header requirement)
    const isPrivate = method === "POST" || path.includes("/account/") || path.includes("/wallet/") || path.includes("/trade/place") || path.includes("/trade/cancel") || path.includes("/mix/order/") || path.includes("/mix/account/") || path.includes("/mix/position/") || path.includes("/earn/") || path.includes("/user/") || path.includes("/broker/") || path.includes("/copy/") || path.includes("/convert/trade") || path.includes("/p2p/orderList") || path.includes("/p2p/merchantInfo");

    if (isPrivate) {
      const hasKey = req.headers["access-key"];
      const hasSign = req.headers["access-sign"];
      const hasPassphrase = req.headers["access-passphrase"];
      const hasTimestamp = req.headers["access-timestamp"];
      if (!hasKey || !hasSign || !hasPassphrase || !hasTimestamp) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: "40017", msg: "Invalid API key", data: null }));
        return;
      }
    }

    // Read body
    let body: Record<string, unknown> = {};
    if (method === "POST") {
      body = await readBody(req);
    }

    const handler = this.routes.get(key);
    if (!handler) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "40001", msg: `Unknown endpoint: ${key}`, data: null }));
      return;
    }

    try {
      const data = handler(req, body, query, state);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "00000", msg: "success", data }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "50000", msg, data: null }));
    }
  }
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString();
      try {
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch {
        resolve({});
      }
    });
  });
}
```

**Step 2: Create `packages/bitget-test-utils/src/server/mock-server.ts`**

```ts
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Router } from "./router.js";
import { createEmptyState, seedState, nextId, type MockState, type SpotOrder } from "./state.js";
import { registerSpotMarketRoutes } from "./routes/spot-market.js";
import { registerSpotTradeRoutes } from "./routes/spot-trade.js";
import { registerFuturesMarketRoutes } from "./routes/futures-market.js";
import { registerFuturesTradeRoutes } from "./routes/futures-trade.js";
import { registerAccountRoutes } from "./routes/account.js";
import { registerMarginRoutes } from "./routes/margin.js";
import { registerCopyTradingRoutes } from "./routes/copy-trading.js";
import { registerConvertRoutes } from "./routes/convert.js";
import { registerEarnRoutes } from "./routes/earn.js";
import { registerP2pRoutes } from "./routes/p2p.js";
import { registerBrokerRoutes } from "./routes/broker.js";

export class MockServer {
  private state: MockState;
  private router: Router;
  private server: Server | null = null;

  constructor(initialState?: Partial<MockState>) {
    this.state = { ...createEmptyState(), ...initialState };
    seedState(this.state);
    this.router = new Router();
    this.registerAllRoutes();
  }

  private registerAllRoutes(): void {
    registerSpotMarketRoutes(this.router);
    registerSpotTradeRoutes(this.router);
    registerFuturesMarketRoutes(this.router);
    registerFuturesTradeRoutes(this.router);
    registerAccountRoutes(this.router);
    registerMarginRoutes(this.router);
    registerCopyTradingRoutes(this.router);
    registerConvertRoutes(this.router);
    registerEarnRoutes(this.router);
    registerP2pRoutes(this.router);
    registerBrokerRoutes(this.router);
  }

  start(port = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        void this.router.handle(req, res, this.state);
      });
      this.server.on("error", reject);
      this.server.listen(port, "127.0.0.1", () => {
        const addr = this.server!.address() as AddressInfo;
        resolve(addr.port);
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) { resolve(); return; }
      this.server.close((err) => (err ? reject(err) : resolve()));
      this.server = null;
    });
  }

  reset(): void {
    const empty = createEmptyState();
    Object.assign(this.state, empty);
    seedState(this.state);
  }

  getState(): MockState {
    return this.state;
  }

  setState(patch: Partial<MockState>): void {
    Object.assign(this.state, patch);
  }

  seedOrder(order: Partial<SpotOrder>): string {
    const orderId = order.orderId ?? nextId("ORDER");
    const now = Date.now().toString();
    const full: SpotOrder = {
      orderId,
      symbol: order.symbol ?? "BTCUSDT",
      side: order.side ?? "buy",
      orderType: order.orderType ?? "limit",
      price: order.price ?? "50000",
      size: order.size ?? "0.001",
      status: order.status ?? "live",
      fillSize: order.fillSize ?? "0",
      cTime: now,
      uTime: now,
      ...order,
    };
    this.state.spotOrders.set(orderId, full);
    return orderId;
  }
}
```

**Step 3: Typecheck (will fail until route files exist — create stubs first)**

Create `packages/bitget-test-utils/src/server/routes/spot-market.ts` stub:

```ts
import type { Router } from "../router.js";
export function registerSpotMarketRoutes(_router: Router): void {}
```

Create the same stub for all other 10 route files:
- `spot-trade.ts`, `futures-market.ts`, `futures-trade.ts`, `account.ts`, `margin.ts`, `copy-trading.ts`, `convert.ts`, `earn.ts`, `p2p.ts`, `broker.ts`

Each stub is identical (just change the function name to match: `registerSpotTradeRoutes`, etc.).

**Step 4: Typecheck**

```bash
cd packages/bitget-test-utils && pnpm typecheck
```

Expected: no errors.

**Step 5: Commit**

```bash
git add packages/bitget-test-utils/src/
git commit -m "feat(test-utils): add Router, MockServer core, and route stubs"
```

---

### Task 4: Spot market routes

**Files:**
- Modify: `packages/bitget-test-utils/src/server/routes/spot-market.ts`

Replace the stub with full implementation:

```ts
import type { Router } from "../router.js";
import { SPOT_TICKERS } from "../fixtures.js";

export function registerSpotMarketRoutes(router: Router): void {
  // GET /api/v2/spot/market/tickers
  router.register("GET", "/api/v2/spot/market/tickers", (_req, _body, query) => {
    const symbol = query.get("symbol");
    const entries = Object.entries(SPOT_TICKERS);
    const filtered = symbol ? entries.filter(([s]) => s === symbol) : entries;
    return filtered.map(([sym, t]) => ({
      symbol: sym,
      lastPr: t.lastPr,
      bidPr: t.bidPr,
      askPr: t.askPr,
      change24h: t.change24h,
      high24h: t.lastPr,
      low24h: t.lastPr,
      baseVolume: "1000",
      quoteVolume: "50000000",
      ts: Date.now().toString(),
    }));
  });

  // GET /api/v2/spot/market/orderbook
  router.register("GET", "/api/v2/spot/market/orderbook", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    const price = parseFloat(ticker.lastPr);
    return {
      asks: [[String(price + 1), "0.5"], [String(price + 2), "1.0"]],
      bids: [[String(price - 1), "0.5"], [String(price - 2), "1.0"]],
      ts: Date.now().toString(),
    };
  });

  // GET /api/v2/spot/market/merge-depth
  router.register("GET", "/api/v2/spot/market/merge-depth", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    const price = parseFloat(ticker.lastPr);
    return {
      asks: [[String(price + 10), "2.0"]],
      bids: [[String(price - 10), "2.0"]],
      ts: Date.now().toString(),
    };
  });

  // GET /api/v2/spot/market/candles
  router.register("GET", "/api/v2/spot/market/candles", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    const price = parseFloat(ticker.lastPr);
    return [[Date.now().toString(), String(price), String(price + 50), String(price - 50), String(price), "100", "5000000"]];
  });

  // GET /api/v2/spot/market/history-candles — same shape
  router.register("GET", "/api/v2/spot/market/history-candles", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    const price = parseFloat(ticker.lastPr);
    return [[String(Date.now() - 60000), String(price - 100), String(price), String(price - 200), String(price - 100), "80", "4000000"]];
  });

  // GET /api/v2/spot/market/fills
  router.register("GET", "/api/v2/spot/market/fills", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    return [{ tradeId: "t001", symbol, side: "buy", price: ticker.lastPr, size: "0.01", ts: Date.now().toString() }];
  });

  // GET /api/v2/spot/market/fills-history — same shape
  router.register("GET", "/api/v2/spot/market/fills-history", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    return [{ tradeId: "t000", symbol, side: "sell", price: ticker.lastPr, size: "0.02", ts: String(Date.now() - 3600000) }];
  });

  // GET /api/v2/spot/public/symbols
  router.register("GET", "/api/v2/spot/public/symbols", () => {
    return Object.keys(SPOT_TICKERS).map((symbol) => ({
      symbol,
      baseCoin: symbol.replace("USDT", ""),
      quoteCoin: "USDT",
      status: "online",
      minTradeAmount: "0.0001",
      maxTradeAmount: "1000",
    }));
  });

  // GET /api/v2/spot/public/coins
  router.register("GET", "/api/v2/spot/public/coins", () => {
    return [
      { coin: "BTC", coinId: "1", chains: [{ chain: "BTC", withdrawFee: "0.0005" }] },
      { coin: "ETH", coinId: "2", chains: [{ chain: "ERC20", withdrawFee: "0.005" }] },
      { coin: "USDT", coinId: "3", chains: [{ chain: "TRC20", withdrawFee: "1" }] },
    ];
  });
}
```

**Step 2: Typecheck**

```bash
cd packages/bitget-test-utils && pnpm typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add packages/bitget-test-utils/src/server/routes/spot-market.ts
git commit -m "feat(test-utils): implement spot market mock routes"
```

---

### Task 5: Spot trade routes

**Files:**
- Modify: `packages/bitget-test-utils/src/server/routes/spot-trade.ts`

```ts
import type { Router } from "../router.js";
import { nextId } from "../state.js";
import type { SpotOrder } from "../state.js";

export function registerSpotTradeRoutes(router: Router): void {
  // POST /api/v2/spot/trade/place-order (single)
  router.register("POST", "/api/v2/spot/trade/place-order", (_req, body, _query, state) => {
    const orderId = nextId("ORDER");
    const now = Date.now().toString();
    const order: SpotOrder = {
      orderId,
      clientOid: body["clientOid"] as string | undefined,
      symbol: (body["symbol"] as string) ?? "BTCUSDT",
      side: (body["side"] as string) ?? "buy",
      orderType: (body["orderType"] as string) ?? "limit",
      price: body["price"] as string | undefined,
      size: (body["size"] as string) ?? "0",
      status: "live",
      fillSize: "0",
      cTime: now,
      uTime: now,
    };
    state.spotOrders.set(orderId, order);
    return { orderId, clientOid: order.clientOid ?? "" };
  });

  // POST /api/v2/spot/trade/batch-orders
  router.register("POST", "/api/v2/spot/trade/batch-orders", (_req, body, _query, state) => {
    const orderList = (body["orderList"] as Record<string, unknown>[]) ?? [];
    const result = orderList.map((o) => {
      const orderId = nextId("ORDER");
      const now = Date.now().toString();
      const order: SpotOrder = {
        orderId,
        clientOid: o["clientOid"] as string | undefined,
        symbol: (o["symbol"] as string) ?? "BTCUSDT",
        side: (o["side"] as string) ?? "buy",
        orderType: (o["orderType"] as string) ?? "limit",
        price: o["price"] as string | undefined,
        size: (o["size"] as string) ?? "0",
        status: "live",
        fillSize: "0",
        cTime: now,
        uTime: now,
      };
      state.spotOrders.set(orderId, order);
      return { orderId, clientOid: order.clientOid ?? "" };
    });
    return { successList: result, failureList: [] };
  });

  // POST /api/v2/spot/trade/cancel-order
  router.register("POST", "/api/v2/spot/trade/cancel-order", (_req, body, _query, state) => {
    const orderId = body["orderId"] as string;
    const order = state.spotOrders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    order.status = "cancelled";
    order.uTime = Date.now().toString();
    return { orderId, clientOid: order.clientOid ?? "" };
  });

  // POST /api/v2/spot/trade/batch-cancel-order
  router.register("POST", "/api/v2/spot/trade/batch-cancel-order", (_req, body, _query, state) => {
    const orderIds = (body["orderIds"] as string[]) ?? [];
    const successList = orderIds.map((orderId) => {
      const order = state.spotOrders.get(orderId);
      if (order) { order.status = "cancelled"; order.uTime = Date.now().toString(); }
      return { orderId };
    });
    return { successList, failureList: [] };
  });

  // POST /api/v2/spot/trade/cancel-symbol-order
  router.register("POST", "/api/v2/spot/trade/cancel-symbol-order", (_req, body, _query, state) => {
    const symbol = body["symbol"] as string;
    for (const order of state.spotOrders.values()) {
      if (order.symbol === symbol && order.status === "live") {
        order.status = "cancelled";
        order.uTime = Date.now().toString();
      }
    }
    return { symbol };
  });

  // POST /api/v2/spot/trade/cancel-replace-order
  router.register("POST", "/api/v2/spot/trade/cancel-replace-order", (_req, body, _query, state) => {
    const oldId = body["orderId"] as string;
    const old = state.spotOrders.get(oldId);
    if (old) { old.status = "cancelled"; old.uTime = Date.now().toString(); }
    const newId = nextId("ORDER");
    const now = Date.now().toString();
    const newOrder: SpotOrder = {
      orderId: newId,
      symbol: old?.symbol ?? (body["symbol"] as string) ?? "BTCUSDT",
      side: old?.side ?? "buy",
      orderType: old?.orderType ?? "limit",
      price: body["price"] as string | undefined,
      size: (body["newSize"] as string) ?? old?.size ?? "0",
      status: "live",
      fillSize: "0",
      cTime: now,
      uTime: now,
    };
    state.spotOrders.set(newId, newOrder);
    return { orderId: newId, clientOid: "" };
  });

  // GET /api/v2/spot/trade/orderInfo
  router.register("GET", "/api/v2/spot/trade/orderInfo", (_req, _body, query, state) => {
    const orderId = query.get("orderId");
    if (!orderId) return null;
    return state.spotOrders.get(orderId) ?? null;
  });

  // GET /api/v2/spot/trade/unfilled-orders
  router.register("GET", "/api/v2/spot/trade/unfilled-orders", (_req, _body, query, state) => {
    const symbol = query.get("symbol");
    return [...state.spotOrders.values()].filter((o) =>
      o.status === "live" && (!symbol || o.symbol === symbol)
    );
  });

  // GET /api/v2/spot/trade/history-orders
  router.register("GET", "/api/v2/spot/trade/history-orders", (_req, _body, query, state) => {
    const symbol = query.get("symbol");
    return [...state.spotOrders.values()].filter((o) =>
      (o.status === "filled" || o.status === "cancelled") && (!symbol || o.symbol === symbol)
    );
  });

  // GET /api/v2/spot/trade/fills
  router.register("GET", "/api/v2/spot/trade/fills", () => []);

  // POST /api/v2/spot/trade/place-plan-order
  router.register("POST", "/api/v2/spot/trade/place-plan-order", (_req, body, _query, state) => {
    const orderId = nextId("PLAN");
    state.spotPlanOrders.set(orderId, {
      orderId,
      symbol: (body["symbol"] as string) ?? "BTCUSDT",
      side: (body["side"] as string) ?? "buy",
      orderType: (body["orderType"] as string) ?? "limit",
      triggerPrice: (body["triggerPrice"] as string) ?? "0",
      triggerType: (body["triggerType"] as string) ?? "fill_price",
      size: (body["size"] as string) ?? "0",
      status: "live",
      cTime: Date.now().toString(),
    });
    return { orderId };
  });

  // POST /api/v2/spot/trade/modify-plan-order
  router.register("POST", "/api/v2/spot/trade/modify-plan-order", (_req, body, _query, state) => {
    const orderId = body["orderId"] as string;
    const order = state.spotPlanOrders.get(orderId);
    if (!order) throw new Error(`Plan order ${orderId} not found`);
    if (body["triggerPrice"]) order.triggerPrice = body["triggerPrice"] as string;
    if (body["size"]) order.size = body["size"] as string;
    return { orderId };
  });

  // GET /api/v2/spot/trade/current-plan-order
  router.register("GET", "/api/v2/spot/trade/current-plan-order", (_req, _body, _query, state) => {
    return [...state.spotPlanOrders.values()].filter((o) => o.status === "live");
  });

  // GET /api/v2/spot/trade/history-plan-order
  router.register("GET", "/api/v2/spot/trade/history-plan-order", (_req, _body, _query, state) => {
    return [...state.spotPlanOrders.values()].filter((o) => o.status !== "live");
  });

  // POST /api/v2/spot/trade/cancel-plan-order
  router.register("POST", "/api/v2/spot/trade/cancel-plan-order", (_req, body, _query, state) => {
    const orderId = body["orderId"] as string;
    const order = state.spotPlanOrders.get(orderId);
    if (order) order.status = "cancelled";
    return { orderId };
  });

  // POST /api/v2/spot/trade/batch-cancel-plan-order
  router.register("POST", "/api/v2/spot/trade/batch-cancel-plan-order", (_req, body, _query, state) => {
    const symbol = body["symbol"] as string;
    for (const order of state.spotPlanOrders.values()) {
      if (!symbol || order.symbol === symbol) order.status = "cancelled";
    }
    return { symbol };
  });
}
```

**Step 2: Typecheck**

```bash
cd packages/bitget-test-utils && pnpm typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add packages/bitget-test-utils/src/server/routes/spot-trade.ts
git commit -m "feat(test-utils): implement spot trade mock routes"
```

---

### Task 6: Futures market + futures trade routes

**Files:**
- Modify: `packages/bitget-test-utils/src/server/routes/futures-market.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/futures-trade.ts`

**Step 1: Implement `futures-market.ts`**

```ts
import type { Router } from "../router.js";
import { FUTURES_TICKERS } from "../fixtures.js";

export function registerFuturesMarketRoutes(router: Router): void {
  // GET /api/v2/mix/market/ticker and /api/v2/mix/market/tickers
  const tickerHandler = (_req: unknown, _body: unknown, query: URLSearchParams) => {
    const symbol = query.get("symbol");
    const entries = Object.entries(FUTURES_TICKERS);
    const filtered = symbol ? entries.filter(([s]) => s === symbol) : entries;
    return filtered.map(([sym, t]) => ({
      symbol: sym,
      productType: t.productType,
      lastPr: t.lastPr,
      bidPr: t.bidPr,
      askPr: t.askPr,
      fundingRate: t.fundingRate,
      change24h: "0.01",
      high24h: t.lastPr,
      low24h: t.lastPr,
      holdingAmount: "5000",
      baseVolume: "200",
      quoteVolume: "10000000",
      ts: Date.now().toString(),
    }));
  };
  router.register("GET", "/api/v2/mix/market/ticker", tickerHandler);
  router.register("GET", "/api/v2/mix/market/tickers", tickerHandler);

  // GET /api/v2/mix/market/merge-depth
  router.register("GET", "/api/v2/mix/market/merge-depth", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const t = FUTURES_TICKERS[symbol] ?? FUTURES_TICKERS["BTCUSDT"]!;
    const price = parseFloat(t.lastPr);
    return { asks: [[String(price + 5), "1.0"]], bids: [[String(price - 5), "1.0"]], ts: Date.now().toString() };
  });

  // candles endpoints (all same shape)
  for (const path of [
    "/api/v2/mix/market/candles",
    "/api/v2/mix/market/history-candles",
    "/api/v2/mix/market/history-mark-candles",
    "/api/v2/mix/market/history-index-candles",
  ]) {
    router.register("GET", path, (_req, _body, query) => {
      const symbol = query.get("symbol") ?? "BTCUSDT";
      const t = FUTURES_TICKERS[symbol] ?? FUTURES_TICKERS["BTCUSDT"]!;
      const p = parseFloat(t.lastPr);
      return [[Date.now().toString(), String(p), String(p + 100), String(p - 100), String(p), "50", "2500000"]];
    });
  }

  // fills
  router.register("GET", "/api/v2/mix/market/fills", () => []);
  router.register("GET", "/api/v2/mix/market/fills-history", () => []);

  // contracts
  router.register("GET", "/api/v2/mix/market/contracts", (_req, _body, query) => {
    const productType = query.get("productType") ?? "usdt-futures";
    return Object.keys(FUTURES_TICKERS).map((sym) => ({
      symbol: sym,
      productType,
      baseCoin: sym.replace("USDT", ""),
      quoteCoin: "USDT",
      status: "normal",
      minTradeNum: "0.001",
      volumePlace: "3",
    }));
  });

  // funding rate endpoints
  router.register("GET", "/api/v2/mix/market/history-fund-rate", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const t = FUTURES_TICKERS[symbol] ?? FUTURES_TICKERS["BTCUSDT"]!;
    return [{ symbol, fundingRate: t.fundingRate, settleTime: Date.now().toString() }];
  });
  router.register("GET", "/api/v2/mix/market/current-fund-rate", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const t = FUTURES_TICKERS[symbol] ?? FUTURES_TICKERS["BTCUSDT"]!;
    return [{ symbol, fundingRate: t.fundingRate }];
  });
  router.register("GET", "/api/v2/mix/market/funding-time", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    return [{ symbol, fundingTime: Date.now().toString(), interval: "8h" }];
  });

  // open interest
  router.register("GET", "/api/v2/mix/market/open-interest", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    return [{ symbol, openInterestList: [{ openInterestValue: "500000000" }] }];
  });
}
```

**Step 2: Implement `futures-trade.ts`**

```ts
import type { Router } from "../router.js";
import { nextId } from "../state.js";
import type { FuturesOrder } from "../state.js";

export function registerFuturesTradeRoutes(router: Router): void {
  // POST /api/v2/mix/order/place-order
  router.register("POST", "/api/v2/mix/order/place-order", (_req, body, _query, state) => {
    const orderId = nextId("FORDER");
    const now = Date.now().toString();
    const order: FuturesOrder = {
      orderId,
      clientOid: body["clientOid"] as string | undefined,
      symbol: (body["symbol"] as string) ?? "BTCUSDT",
      productType: (body["productType"] as string) ?? "usdt-futures",
      side: (body["side"] as string) ?? "buy",
      tradeSide: (body["tradeSide"] as string) ?? "open",
      orderType: (body["orderType"] as string) ?? "limit",
      price: body["price"] as string | undefined,
      size: (body["size"] as string) ?? "0",
      status: "live",
      cTime: now,
      uTime: now,
    };
    state.futuresOrders.set(orderId, order);
    return { orderId, clientOid: order.clientOid ?? "" };
  });

  // POST /api/v2/mix/order/batch-place-order
  router.register("POST", "/api/v2/mix/order/batch-place-order", (_req, body, _query, state) => {
    const orderList = (body["orderList"] as Record<string, unknown>[]) ?? [];
    const result = orderList.map((o) => {
      const orderId = nextId("FORDER");
      const now = Date.now().toString();
      const order: FuturesOrder = {
        orderId,
        symbol: (o["symbol"] as string) ?? "BTCUSDT",
        productType: (o["productType"] as string) ?? "usdt-futures",
        side: (o["side"] as string) ?? "buy",
        tradeSide: (o["tradeSide"] as string) ?? "open",
        orderType: (o["orderType"] as string) ?? "limit",
        price: o["price"] as string | undefined,
        size: (o["size"] as string) ?? "0",
        status: "live",
        cTime: now,
        uTime: now,
      };
      state.futuresOrders.set(orderId, order);
      return { orderId };
    });
    return { successList: result, failureList: [] };
  });

  // POST /api/v2/mix/order/cancel-order
  router.register("POST", "/api/v2/mix/order/cancel-order", (_req, body, _query, state) => {
    const orderId = body["orderId"] as string;
    const order = state.futuresOrders.get(orderId);
    if (order) { order.status = "cancelled"; order.uTime = Date.now().toString(); }
    return { orderId };
  });

  // POST /api/v2/mix/order/batch-cancel-orders
  router.register("POST", "/api/v2/mix/order/batch-cancel-orders", (_req, body, _query, state) => {
    const orderIds = (body["orderIds"] as string[]) ?? [];
    orderIds.forEach((id) => {
      const o = state.futuresOrders.get(id);
      if (o) { o.status = "cancelled"; o.uTime = Date.now().toString(); }
    });
    return { successList: orderIds.map((id) => ({ orderId: id })), failureList: [] };
  });

  // POST /api/v2/mix/order/cancel-all-orders
  router.register("POST", "/api/v2/mix/order/cancel-all-orders", (_req, _body, _query, state) => {
    for (const o of state.futuresOrders.values()) {
      if (o.status === "live") { o.status = "cancelled"; o.uTime = Date.now().toString(); }
    }
    return {};
  });

  // GET /api/v2/mix/order/detail
  router.register("GET", "/api/v2/mix/order/detail", (_req, _body, query, state) => {
    const orderId = query.get("orderId");
    return orderId ? (state.futuresOrders.get(orderId) ?? null) : null;
  });

  // GET /api/v2/mix/order/orders-pending
  router.register("GET", "/api/v2/mix/order/orders-pending", (_req, _body, query, state) => {
    const symbol = query.get("symbol");
    return [...state.futuresOrders.values()].filter((o) => o.status === "live" && (!symbol || o.symbol === symbol));
  });

  // GET /api/v2/mix/order/orders-history
  router.register("GET", "/api/v2/mix/order/orders-history", (_req, _body, query, state) => {
    const symbol = query.get("symbol");
    return [...state.futuresOrders.values()].filter((o) => o.status !== "live" && (!symbol || o.symbol === symbol));
  });

  // GET /api/v2/mix/order/fills and fill-history
  router.register("GET", "/api/v2/mix/order/fills", () => []);
  router.register("GET", "/api/v2/mix/order/fill-history", () => []);

  // GET /api/v2/mix/position/all-position
  router.register("GET", "/api/v2/mix/position/all-position", (_req, _body, _query, state) => {
    return [...state.positions.values()];
  });

  // GET /api/v2/mix/position/single-position
  router.register("GET", "/api/v2/mix/position/single-position", (_req, _body, query, state) => {
    const symbol = query.get("symbol");
    return [...state.positions.values()].filter((p) => !symbol || p.symbol === symbol);
  });

  // GET /api/v2/mix/position/history-position
  router.register("GET", "/api/v2/mix/position/history-position", () => []);

  // POST /api/v2/mix/account/set-leverage
  router.register("POST", "/api/v2/mix/account/set-leverage", (_req, body, _query, state) => {
    const symbol = body["symbol"] as string;
    const leverage = Number(body["leverage"]);
    state.leverage.set(symbol, leverage);
    return { symbol, leverage: String(leverage) };
  });

  // POST /api/v2/mix/account/set-margin-mode
  router.register("POST", "/api/v2/mix/account/set-margin-mode", (_req, body) => {
    return { symbol: body["symbol"], marginMode: body["marginMode"] };
  });

  // POST /api/v2/mix/account/set-position-mode
  router.register("POST", "/api/v2/mix/account/set-position-mode", (_req, body) => {
    return { productType: body["productType"], posMode: body["posMode"] };
  });

  // POST /api/v2/mix/account/set-auto-margin
  router.register("POST", "/api/v2/mix/account/set-auto-margin", (_req, body) => {
    return { symbol: body["symbol"], autoMargin: body["autoMargin"] };
  });
}
```

**Step 3: Typecheck**

```bash
cd packages/bitget-test-utils && pnpm typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add packages/bitget-test-utils/src/server/routes/futures-market.ts packages/bitget-test-utils/src/server/routes/futures-trade.ts
git commit -m "feat(test-utils): implement futures market and trade mock routes"
```

---

### Task 7: Account, margin, copy-trading, convert, earn, p2p, broker routes

**Files:**
- Modify: `packages/bitget-test-utils/src/server/routes/account.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/margin.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/copy-trading.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/convert.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/earn.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/p2p.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/broker.ts`

**Step 1: Implement `account.ts`**

```ts
import type { Router } from "../router.js";
import { nextId } from "../state.js";

export function registerAccountRoutes(router: Router): void {
  // GET /api/v2/spot/account/assets
  router.register("GET", "/api/v2/spot/account/assets", (_req, _body, query, state) => {
    const coin = query.get("coin");
    const balances = [...state.balances.values()];
    return coin ? balances.filter((b) => b.coin === coin) : balances;
  });

  // GET /api/v2/mix/account/accounts
  router.register("GET", "/api/v2/mix/account/accounts", (_req, _body, _query, state) => {
    const usdt = state.balances.get("USDT");
    return [{ marginCoin: "USDT", available: usdt?.available ?? "0", frozen: usdt?.frozen ?? "0" }];
  });

  // GET /api/v2/account/funding-assets
  router.register("GET", "/api/v2/account/funding-assets", (_req, _body, _query, state) => {
    return [...state.balances.values()].map((b) => ({ coin: b.coin, available: b.available }));
  });

  // GET /api/v2/account/all-account-balance
  router.register("GET", "/api/v2/account/all-account-balance", (_req, _body, _query, state) => {
    return [...state.balances.values()];
  });

  // GET /api/v2/spot/account/bills
  router.register("GET", "/api/v2/spot/account/bills", () => []);

  // GET /api/v2/mix/account/bill
  router.register("GET", "/api/v2/mix/account/bill", () => []);

  // POST /api/v2/spot/wallet/transfer
  router.register("POST", "/api/v2/spot/wallet/transfer", (_req, body, _query, state) => {
    const transferId = nextId("TXF");
    state.transfers.push({
      transferId,
      coin: (body["coin"] as string) ?? "USDT",
      size: (body["size"] as string) ?? "0",
      fromType: (body["fromType"] as string) ?? "spot",
      toType: (body["toType"] as string) ?? "mix_usdt",
      cTime: Date.now().toString(),
    });
    return { transferId };
  });

  // POST /api/v2/spot/wallet/subaccount-transfer
  router.register("POST", "/api/v2/spot/wallet/subaccount-transfer", (_req, body, _query, state) => {
    const transferId = nextId("STXF");
    state.transfers.push({
      transferId,
      coin: (body["coin"] as string) ?? "USDT",
      size: (body["size"] as string) ?? "0",
      fromType: "spot",
      toType: "spot",
      cTime: Date.now().toString(),
    });
    return { transferId };
  });

  // POST /api/v2/spot/wallet/withdrawal
  router.register("POST", "/api/v2/spot/wallet/withdrawal", (_req, body, _query, state) => {
    const withdrawalId = nextId("WD");
    state.withdrawals.set(withdrawalId, {
      withdrawalId,
      coin: (body["coin"] as string) ?? "USDT",
      size: (body["size"] as string) ?? "0",
      address: (body["address"] as string) ?? "",
      status: "pending",
      cTime: Date.now().toString(),
    });
    return { withdrawalId };
  });

  // POST /api/v2/spot/wallet/cancel-withdrawal
  router.register("POST", "/api/v2/spot/wallet/cancel-withdrawal", (_req, body, _query, state) => {
    const id = body["withdrawalId"] as string;
    const w = state.withdrawals.get(id);
    if (w) w.status = "cancelled" as "pending";
    return { withdrawalId: id };
  });

  // GET /api/v2/spot/wallet/deposit-address
  router.register("GET", "/api/v2/spot/wallet/deposit-address", (_req, _body, query) => {
    const coin = query.get("coin") ?? "USDT";
    return { coin, address: `mock-${coin.toLowerCase()}-address-0x1234`, chain: "TRC20" };
  });

  // GET /api/v2/spot/wallet/deposit-records
  router.register("GET", "/api/v2/spot/wallet/deposit-records", (_req, _body, _query, state) => state.deposits);

  // GET /api/v2/spot/wallet/withdrawal-records
  router.register("GET", "/api/v2/spot/wallet/withdrawal-records", (_req, _body, _query, state) => [...state.withdrawals.values()]);

  // GET /api/v2/spot/account/sub-main-trans-record
  router.register("GET", "/api/v2/spot/account/sub-main-trans-record", (_req, _body, _query, state) => state.transfers);

  // GET /api/v2/user/virtual-subaccount-list
  router.register("GET", "/api/v2/user/virtual-subaccount-list", (_req, _body, _query, state) => [...state.subaccounts.values()]);

  // GET /api/v2/user/virtual-subaccount-apikey-list
  router.register("GET", "/api/v2/user/virtual-subaccount-apikey-list", () => []);

  // POST create/modify subaccount endpoints
  for (const path of [
    "/api/v2/user/create-virtual-subaccount",
    "/api/v2/user/modify-virtual-subaccount",
  ]) {
    router.register("POST", path, (_req, body, _query, state) => {
      const subUid = (body["subUid"] as string) ?? nextId("SUB");
      state.subaccounts.set(subUid, {
        subUid,
        subName: (body["subName"] as string) ?? "subaccount",
        status: "normal",
      });
      return { subUid };
    });
  }

  // POST create/modify subaccount apikey
  for (const path of [
    "/api/v2/user/create-virtual-subaccount-apikey",
    "/api/v2/user/modify-virtual-subaccount-apikey",
  ]) {
    router.register("POST", path, (_req, body) => ({
      subUid: body["subUid"],
      apiKey: "mock-apikey-" + nextId("K"),
    }));
  }
}
```

**Step 2: Implement `margin.ts`**

```ts
import type { Router } from "../router.js";
import { nextId } from "../state.js";
import type { MarginOrder } from "../state.js";

export function registerMarginRoutes(router: Router): void {
  // Margin endpoints use pattern /api/v2/margin/{cross|isolated}/{suffix}
  // Register common ones:
  for (const scope of ["cross", "isolated"] as const) {
    // place-order
    router.register("POST", `/api/v2/margin/${scope}/place-order`, (_req, body, _query, state) => {
      const orderId = nextId("MORDER");
      const now = Date.now().toString();
      const order: MarginOrder = {
        orderId,
        symbol: (body["symbol"] as string) ?? "BTCUSDT",
        side: (body["side"] as string) ?? "buy",
        orderType: (body["orderType"] as string) ?? "limit",
        price: body["price"] as string | undefined,
        size: (body["size"] as string) ?? "0",
        status: "live",
        cTime: now,
      };
      state.marginOrders.set(orderId, order);
      return { orderId };
    });

    // cancel-order
    router.register("POST", `/api/v2/margin/${scope}/cancel-order`, (_req, body, _query, state) => {
      const orderId = body["orderId"] as string;
      const order = state.marginOrders.get(orderId);
      if (order) order.status = "cancelled";
      return { orderId };
    });

    // open-orders
    router.register("GET", `/api/v2/margin/${scope}/open-orders`, (_req, _body, _query, state) => {
      return [...state.marginOrders.values()].filter((o) => o.status === "live");
    });

    // history-orders
    router.register("GET", `/api/v2/margin/${scope}/history-orders`, (_req, _body, _query, state) => {
      return [...state.marginOrders.values()].filter((o) => o.status !== "live");
    });

    // account (balance info)
    router.register("GET", `/api/v2/margin/${scope}/account`, (_req, _body, _query, state) => {
      const usdt = state.balances.get("USDT");
      return { marginCoin: "USDT", available: usdt?.available ?? "0", risk: "0.1" };
    });

    // interest-history
    router.register("GET", `/api/v2/margin/${scope}/interest-history`, () => []);

    // liquidation-history
    router.register("GET", `/api/v2/margin/${scope}/liquidation-history`, () => []);
  }
}
```

**Step 3: Implement `copy-trading.ts`**

```ts
import type { Router } from "../router.js";

export function registerCopyTradingRoutes(router: Router): void {
  for (const mode of ["spot-follower", "mix-follower"] as const) {
    router.register("GET", `/api/v2/copy/${mode}/query-traders`, () => []);
    router.register("POST", `/api/v2/copy/${mode}/settings`, (_req, body) => {
      return { traderId: body["traderId"] };
    });
    router.register("GET", `/api/v2/copy/${mode}/query-history-orders`, () => []);
    router.register("GET", `/api/v2/copy/${mode}/query-current-orders`, () => []);
  }
  router.register("POST", "/api/v2/copy/mix-follower/close-positions", () => ({}));
}
```

**Step 4: Implement `convert.ts`**

```ts
import type { Router } from "../router.js";
import { nextId } from "../state.js";

export function registerConvertRoutes(router: Router): void {
  // GET /api/v2/convert/currencies
  router.register("GET", "/api/v2/convert/currencies", () => {
    return [
      { fromCoin: "BTC", toCoin: "USDT", minTradeAmount: "0.0001" },
      { fromCoin: "ETH", toCoin: "USDT", minTradeAmount: "0.001" },
      { fromCoin: "USDT", toCoin: "BTC", minTradeAmount: "10" },
    ];
  });

  // GET /api/v2/convert/quoted-price  (GET for query, POST for trade)
  router.register("GET", "/api/v2/convert/quoted-price", (_req, _body, query, state) => {
    const fromCoin = query.get("fromCoin") ?? "USDT";
    const toCoin = query.get("toCoin") ?? "BTC";
    const quoteId = nextId("QUOTE");
    const quote = {
      quoteId,
      fromCoin,
      toCoin,
      fromSize: query.get("fromAmount") ?? "100",
      toSize: toCoin === "BTC" ? "0.002" : "1",
      price: "50000",
      expireTime: String(Date.now() + 30000),
    };
    state.convertQuotes.set(quoteId, quote);
    return quote;
  });

  // POST /api/v2/convert/quoted-price
  router.register("POST", "/api/v2/convert/quoted-price", (_req, body, _query, state) => {
    const fromCoin = (body["fromCoin"] as string) ?? "USDT";
    const toCoin = (body["toCoin"] as string) ?? "BTC";
    const quoteId = nextId("QUOTE");
    const quote = {
      quoteId,
      fromCoin,
      toCoin,
      fromSize: (body["fromAmount"] as string) ?? "100",
      toSize: toCoin === "BTC" ? "0.002" : "1",
      price: "50000",
      expireTime: String(Date.now() + 30000),
    };
    state.convertQuotes.set(quoteId, quote);
    return quote;
  });

  // POST /api/v2/convert/trade
  router.register("POST", "/api/v2/convert/trade", (_req, body, _query, state) => {
    const quoteId = body["quoteId"] as string;
    const quote = state.convertQuotes.get(quoteId);
    const tradeId = nextId("CVT");
    state.convertHistory.push({
      tradeId,
      fromCoin: quote?.fromCoin ?? "USDT",
      toCoin: quote?.toCoin ?? "BTC",
      fromSize: quote?.fromSize ?? "0",
      toSize: quote?.toSize ?? "0",
      status: "success",
      cTime: Date.now().toString(),
    });
    return { tradeId, status: "success" };
  });

  // POST /api/v2/convert/bgb-convert (same shape)
  router.register("POST", "/api/v2/convert/bgb-convert", (_req, _body, _query, state) => {
    const tradeId = nextId("BGBCVT");
    state.convertHistory.push({ tradeId, fromCoin: "BGB", toCoin: "USDT", fromSize: "100", toSize: "50", status: "success", cTime: Date.now().toString() });
    return { tradeId, status: "success" };
  });

  // GET /api/v2/convert/convert-record
  router.register("GET", "/api/v2/convert/convert-record", (_req, _body, _query, state) => state.convertHistory);

  // GET /api/v2/convert/bgb-convert-records
  router.register("GET", "/api/v2/convert/bgb-convert-records", (_req, _body, _query, state) => state.convertHistory.filter((r) => r.fromCoin === "BGB"));
}
```

**Step 5: Implement `earn.ts`**

```ts
import type { Router } from "../router.js";
import { nextId } from "../state.js";

export function registerEarnRoutes(router: Router): void {
  // GET /api/v2/earn/product/list and /api/v2/earn/saving/product/list
  for (const path of ["/api/v2/earn/product/list", "/api/v2/earn/saving/product/list"]) {
    router.register("GET", path, (_req, _body, _query, state) => state.earnProducts);
  }

  // GET /api/v2/earn/holding/list and /api/v2/earn/saving/holding/list
  for (const path of ["/api/v2/earn/holding/list", "/api/v2/earn/saving/holding/list"]) {
    router.register("GET", path, (_req, _body, _query, state) => [...state.earnHoldings.values()]);
  }

  // POST /api/v2/earn/subscribe
  router.register("POST", "/api/v2/earn/subscribe", (_req, body, _query, state) => {
    const holdingId = nextId("EARN");
    const productId = body["productId"] as string;
    const product = state.earnProducts.find((p) => p.productId === productId);
    state.earnHoldings.set(holdingId, {
      holdingId,
      productId,
      coin: product?.coin ?? "USDT",
      size: (body["amount"] as string) ?? "0",
      status: "holding",
    });
    return { holdingId };
  });

  // POST /api/v2/earn/redeem
  router.register("POST", "/api/v2/earn/redeem", (_req, body, _query, state) => {
    const holdingId = body["holdingId"] as string;
    const h = state.earnHoldings.get(holdingId);
    if (h) h.status = "redeemed";
    return { holdingId };
  });
}
```

**Step 6: Implement `p2p.ts`**

```ts
import type { Router } from "../router.js";

export function registerP2pRoutes(router: Router): void {
  router.register("GET", "/api/v2/p2p/merchantInfo", (_req, _body, query) => {
    const userId = query.get("userId") ?? "user001";
    return { userId, nickname: "MockTrader", completedOrders: 100, completionRate: "0.99" };
  });

  router.register("GET", "/api/v2/p2p/merchantList", () => {
    return [{ userId: "user001", nickname: "MockTrader", completedOrders: 100 }];
  });

  router.register("GET", "/api/v2/p2p/advList", () => {
    return [{ advId: "adv001", coin: "USDT", fiatCoin: "CNY", price: "7.2", minAmount: "100", maxAmount: "10000" }];
  });

  router.register("GET", "/api/v2/p2p/orderList", (_req, _body, _query, state) => {
    return [...state.p2pOrders.values()];
  });
}
```

**Step 7: Implement `broker.ts`**

```ts
import type { Router } from "../router.js";
import { nextId } from "../state.js";

export function registerBrokerRoutes(router: Router): void {
  router.register("GET", "/api/v2/broker/account/info", () => {
    return { brokerId: "broker001", brokerName: "MockBroker", status: "normal" };
  });

  router.register("GET", "/api/v2/broker/account/subaccount-list", (_req, _body, _query, state) => {
    return [...state.brokerSubaccounts.values()];
  });

  router.register("POST", "/api/v2/broker/account/create-subaccount", (_req, body, _query, state) => {
    const subUid = nextId("BSUB");
    state.brokerSubaccounts.set(subUid, { subUid, subName: (body["subName"] as string) ?? "sub", status: "normal" });
    return { subUid };
  });

  router.register("POST", "/api/v2/broker/account/modify-subaccount", (_req, body, _query, state) => {
    const subUid = body["subUid"] as string;
    const s = state.brokerSubaccounts.get(subUid);
    if (s && body["status"]) s.status = body["status"] as "normal" | "freeze";
    return { subUid };
  });

  router.register("GET", "/api/v2/broker/account/subaccount-apikey-list", () => []);

  router.register("POST", "/api/v2/broker/account/create-subaccount-apikey", (_req, body) => ({
    subUid: body["subUid"],
    apiKey: "mock-broker-apikey-" + nextId("BK"),
  }));

  router.register("POST", "/api/v2/broker/account/modify-subaccount-apikey", (_req, body) => ({
    subUid: body["subUid"],
    apiKey: body["apiKey"],
  }));
}
```

**Step 8: Typecheck**

```bash
cd packages/bitget-test-utils && pnpm typecheck
```

Expected: no errors.

**Step 9: Commit**

```bash
git add packages/bitget-test-utils/src/server/routes/
git commit -m "feat(test-utils): implement all 9 module mock routes"
```

---

### Task 8: Public exports + standalone CLI

**Files:**
- Create: `packages/bitget-test-utils/src/index.ts`
- Create: `packages/bitget-test-utils/src/bin/mock-server.ts`

**Step 1: Create `src/index.ts`**

```ts
export { MockServer } from "./server/mock-server.js";
export type { MockState, SpotOrder, FuturesOrder, Balance, Position } from "./server/state.js";
export { SPOT_TICKERS, FUTURES_TICKERS } from "./server/fixtures.js";
```

**Step 2: Create `src/bin/mock-server.ts`**

```ts
import { MockServer } from "../server/mock-server.js";

const args = process.argv.slice(2);
const portArg = args.indexOf("--port");
const port = portArg >= 0 ? parseInt(args[portArg + 1] ?? "3210", 10) : 3210;

const server = new MockServer();
const boundPort = await server.start(port);

process.stdout.write(`Bitget mock server running at http://localhost:${boundPort}\n`);
process.stdout.write(`Set BITGET_API_BASE_URL=http://localhost:${boundPort}\n`);
process.stdout.write(`Press Ctrl+C to stop.\n`);

process.on("SIGINT", () => {
  void server.stop().then(() => process.exit(0));
});
```

**Step 3: Build**

```bash
cd packages/bitget-test-utils && pnpm build
```

Expected: `dist/index.js`, `dist/index.d.ts`, `dist/bin/mock-server.js` created.

**Step 4: Smoke test standalone CLI**

```bash
node packages/bitget-test-utils/dist/bin/mock-server.js --port 3210 &
curl -s http://localhost:3210/api/v2/spot/market/tickers | head -c 200
kill %1
```

Expected: JSON with BTCUSDT ticker data.

**Step 5: Commit**

```bash
git add packages/bitget-test-utils/src/index.ts packages/bitget-test-utils/src/bin/mock-server.ts
git commit -m "feat(test-utils): add public exports and standalone CLI"
```

---

### Task 9: Add Vitest to consumer packages

**Files:**
- Modify: `packages/bitget-core/package.json`
- Create: `packages/bitget-core/vitest.config.ts`
- Modify: `packages/bitget-mcp/package.json`
- Create: `packages/bitget-mcp/vitest.config.ts`
- Modify: `packages/bitget-client/package.json`
- Create: `packages/bitget-client/vitest.config.ts`

**Step 1: Add test deps to each consumer `package.json`**

In each of `packages/bitget-core/package.json`, `packages/bitget-mcp/package.json`, `packages/bitget-client/package.json`, add to `devDependencies`:
```json
"bitget-test-utils": "workspace:*",
"vitest": "^2.0.0"
```

And add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 2: Create `vitest.config.ts` in each package (identical content)**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 15000,
  },
});
```

**Step 3: Install dependencies**

```bash
pnpm install
```

Expected: vitest and bitget-test-utils resolved in all three packages.

**Step 4: Commit**

```bash
git add packages/bitget-core/package.json packages/bitget-core/vitest.config.ts packages/bitget-mcp/package.json packages/bitget-mcp/vitest.config.ts packages/bitget-client/package.json packages/bitget-client/vitest.config.ts pnpm-lock.yaml
git commit -m "chore: add vitest and bitget-test-utils to consumer packages"
```

---

### Task 10: bitget-core tool tests — spot market + spot trade

**Files:**
- Create: `packages/bitget-core/tests/tools/spot-market.test.ts`
- Create: `packages/bitget-core/tests/tools/spot-trade.test.ts`

**Step 1: Create `packages/bitget-core/tests/tools/spot-market.test.ts`**

```ts
import { describe, test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { MockServer } from "bitget-test-utils";
import { loadConfig, buildTools, BitgetRestClient } from "bitget-core";
import type { ToolSpec } from "bitget-core";

let server: MockServer;
let tools: ToolSpec[];
let config: ReturnType<typeof loadConfig>;
let client: BitgetRestClient;

beforeAll(async () => {
  server = new MockServer();
  const port = await server.start();
  process.env["BITGET_API_BASE_URL"] = `http://localhost:${port}`;
  config = loadConfig({ modules: "spot", readOnly: false });
  client = new BitgetRestClient(config);
  tools = buildTools(config);
});

beforeEach(() => server.reset());
afterAll(() => server.stop());

function getTool(name: string): ToolSpec {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
}

describe("spot_get_ticker", () => {
  test("returns seeded BTCUSDT ticker", async () => {
    const tool = getTool("spot_get_ticker");
    const result = await tool.handler({ symbol: "BTCUSDT" }, { config, client }) as Record<string, unknown>;
    expect(Array.isArray(result["data"])).toBe(true);
    const tickers = result["data"] as Array<Record<string, unknown>>;
    expect(tickers[0]?.["lastPr"]).toBe("50000");
  });

  test("returns all tickers when no symbol", async () => {
    const tool = getTool("spot_get_ticker");
    const result = await tool.handler({}, { config, client }) as Record<string, unknown>;
    const tickers = result["data"] as Array<Record<string, unknown>>;
    expect(tickers.length).toBe(3);
  });
});

describe("spot_get_depth", () => {
  test("returns orderbook for BTCUSDT", async () => {
    const tool = getTool("spot_get_depth");
    const result = await tool.handler({ symbol: "BTCUSDT" }, { config, client }) as Record<string, unknown>;
    const data = result["data"] as Record<string, unknown>;
    expect(Array.isArray(data["asks"])).toBe(true);
    expect(Array.isArray(data["bids"])).toBe(true);
  });
});

describe("spot_get_candles", () => {
  test("returns candle data", async () => {
    const tool = getTool("spot_get_candles");
    const result = await tool.handler({ symbol: "BTCUSDT", granularity: "1min" }, { config, client }) as Record<string, unknown>;
    expect(Array.isArray(result["data"])).toBe(true);
  });
});

describe("spot_get_trades", () => {
  test("returns trades array", async () => {
    const tool = getTool("spot_get_trades");
    const result = await tool.handler({ symbol: "BTCUSDT" }, { config, client }) as Record<string, unknown>;
    expect(Array.isArray(result["data"])).toBe(true);
  });
});

describe("spot_get_symbols", () => {
  test("returns symbols list", async () => {
    const tool = getTool("spot_get_symbols");
    const result = await tool.handler({}, { config, client }) as Record<string, unknown>;
    const symbols = result["data"] as Array<Record<string, unknown>>;
    expect(symbols.some((s) => s["symbol"] === "BTCUSDT")).toBe(true);
  });

  test("returns coins list when type=coins", async () => {
    const tool = getTool("spot_get_symbols");
    const result = await tool.handler({ type: "coins" }, { config, client }) as Record<string, unknown>;
    const coins = result["data"] as Array<Record<string, unknown>>;
    expect(coins.some((c) => c["coin"] === "BTC")).toBe(true);
  });
});
```

**Step 2: Create `packages/bitget-core/tests/tools/spot-trade.test.ts`**

```ts
import { describe, test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { MockServer } from "bitget-test-utils";
import { loadConfig, buildTools, BitgetRestClient } from "bitget-core";
import type { ToolSpec } from "bitget-core";

let server: MockServer;
let tools: ToolSpec[];
let config: ReturnType<typeof loadConfig>;
let client: BitgetRestClient;

beforeAll(async () => {
  server = new MockServer();
  const port = await server.start();
  process.env["BITGET_API_BASE_URL"] = `http://localhost:${port}`;
  // Spot trade tools require auth headers — provide mock credentials
  process.env["BITGET_API_KEY"] = "test-key";
  process.env["BITGET_SECRET_KEY"] = "test-secret";
  process.env["BITGET_PASSPHRASE"] = "test-passphrase";
  config = loadConfig({ modules: "spot", readOnly: false });
  client = new BitgetRestClient(config);
  tools = buildTools(config);
});

beforeEach(() => server.reset());
afterAll(() => server.stop());

function getTool(name: string): ToolSpec {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
}

describe("spot_place_order → spot_get_orders round-trip", () => {
  test("placed order appears in unfilled orders", async () => {
    const place = getTool("spot_place_order");
    const get = getTool("spot_get_orders");

    const placeResult = await place.handler(
      { orders: [{ symbol: "BTCUSDT", side: "buy", orderType: "limit", price: "49000", size: "0.001" }] },
      { config, client }
    ) as Record<string, unknown>;

    const placeData = placeResult["data"] as Record<string, unknown>;
    const orderId = placeData["orderId"] as string;
    expect(orderId).toBeTruthy();

    const getResult = await get.handler({ symbol: "BTCUSDT", status: "live" }, { config, client }) as Record<string, unknown>;
    const orders = getResult["data"] as Array<Record<string, unknown>>;
    expect(orders.some((o) => o["orderId"] === orderId)).toBe(true);
  });
});

describe("spot_cancel_orders", () => {
  test("cancelling order changes status", async () => {
    const orderId = server.seedOrder({ symbol: "BTCUSDT", side: "buy", status: "live", price: "49000", size: "0.001" });

    const cancel = getTool("spot_cancel_orders");
    await cancel.handler({ orders: [{ orderId, symbol: "BTCUSDT" }] }, { config, client });

    const order = server.getState().spotOrders.get(orderId);
    expect(order?.status).toBe("cancelled");
  });
});

describe("spot_place_plan_order", () => {
  test("creates plan order that appears in current-plan-order", async () => {
    const place = getTool("spot_place_plan_order");
    const placeResult = await place.handler(
      { action: "place", symbol: "BTCUSDT", side: "buy", orderType: "limit", triggerPrice: "48000", size: "0.001" },
      { config, client }
    ) as Record<string, unknown>;
    const orderId = (placeResult["data"] as Record<string, unknown>)["orderId"] as string;
    expect(orderId).toBeTruthy();

    const planOrders = server.getState().spotPlanOrders;
    expect(planOrders.has(orderId)).toBe(true);
  });
});

describe("error injection", () => {
  test("errorOverride returns API error code", async () => {
    server.setState({
      errorOverrides: new Map([["POST /api/v2/spot/trade/place-order", { code: "40786", msg: "Insufficient balance" }]]),
    });

    const place = getTool("spot_place_order");
    await expect(
      place.handler({ orders: [{ symbol: "BTCUSDT", side: "buy", orderType: "limit", price: "49000", size: "999" }] }, { config, client })
    ).rejects.toThrow();
  });
});
```

**Step 3: Run tests**

```bash
cd packages/bitget-core && pnpm test
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add packages/bitget-core/tests/
git commit -m "test(bitget-core): add spot market and spot trade tests"
```

---

### Task 11: bitget-core tests — futures, account, and remaining modules

**Files:**
- Create: `packages/bitget-core/tests/tools/futures-market.test.ts`
- Create: `packages/bitget-core/tests/tools/futures-trade.test.ts`
- Create: `packages/bitget-core/tests/tools/account.test.ts`
- Create: `packages/bitget-core/tests/tools/remaining-modules.test.ts`
- Create: `packages/bitget-core/tests/client/errors.test.ts`

**Step 1: Create `futures-market.test.ts`**

```ts
import { describe, test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { MockServer } from "bitget-test-utils";
import { loadConfig, buildTools, BitgetRestClient } from "bitget-core";
import type { ToolSpec } from "bitget-core";

let server: MockServer;
let tools: ToolSpec[];
let config: ReturnType<typeof loadConfig>;
let client: BitgetRestClient;

beforeAll(async () => {
  server = new MockServer();
  const port = await server.start();
  process.env["BITGET_API_BASE_URL"] = `http://localhost:${port}`;
  config = loadConfig({ modules: "futures", readOnly: false });
  client = new BitgetRestClient(config);
  tools = buildTools(config);
});
beforeEach(() => server.reset());
afterAll(() => server.stop());

function getTool(name: string): ToolSpec {
  return tools.find((t) => t.name === name)!;
}

test("futures_get_ticker returns BTCUSDT data", async () => {
  const result = await getTool("futures_get_ticker").handler(
    { symbol: "BTCUSDT", productType: "usdt-futures" }, { config, client }
  ) as Record<string, unknown>;
  const data = result["data"] as Array<Record<string, unknown>>;
  expect(data[0]?.["lastPr"]).toBe("50100");
});

test("futures_get_contracts returns contract list", async () => {
  const result = await getTool("futures_get_contracts").handler(
    { productType: "usdt-futures" }, { config, client }
  ) as Record<string, unknown>;
  expect(Array.isArray(result["data"])).toBe(true);
});

test("futures_get_funding_rate returns rate", async () => {
  const result = await getTool("futures_get_funding_rate").handler(
    { symbol: "BTCUSDT", productType: "usdt-futures" }, { config, client }
  ) as Record<string, unknown>;
  expect(Array.isArray(result["data"])).toBe(true);
});
```

**Step 2: Create `futures-trade.test.ts`**

```ts
import { describe, test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { MockServer } from "bitget-test-utils";
import { loadConfig, buildTools, BitgetRestClient } from "bitget-core";
import type { ToolSpec } from "bitget-core";

let server: MockServer;
let tools: ToolSpec[];
let config: ReturnType<typeof loadConfig>;
let client: BitgetRestClient;

beforeAll(async () => {
  server = new MockServer();
  const port = await server.start();
  process.env["BITGET_API_BASE_URL"] = `http://localhost:${port}`;
  process.env["BITGET_API_KEY"] = "test-key";
  process.env["BITGET_SECRET_KEY"] = "test-secret";
  process.env["BITGET_PASSPHRASE"] = "test-passphrase";
  config = loadConfig({ modules: "futures", readOnly: false });
  client = new BitgetRestClient(config);
  tools = buildTools(config);
});
beforeEach(() => server.reset());
afterAll(() => server.stop());

function getTool(name: string): ToolSpec {
  return tools.find((t) => t.name === name)!;
}

test("futures_place_order → futures_get_orders round-trip", async () => {
  const placeResult = await getTool("futures_place_order").handler(
    { orders: [{ symbol: "BTCUSDT", productType: "usdt-futures", side: "buy", tradeSide: "open", orderType: "limit", price: "49000", size: "0.001" }] },
    { config, client }
  ) as Record<string, unknown>;
  const orderId = (placeResult["data"] as Record<string, unknown>)["orderId"] as string;
  expect(orderId).toBeTruthy();

  const ordersResult = await getTool("futures_get_orders").handler(
    { symbol: "BTCUSDT", productType: "usdt-futures" }, { config, client }
  ) as Record<string, unknown>;
  const orders = ordersResult["data"] as Array<Record<string, unknown>>;
  expect(orders.some((o) => o["orderId"] === orderId)).toBe(true);
});

test("futures_set_leverage sets leverage in state", async () => {
  await getTool("futures_set_leverage").handler(
    { symbol: "BTCUSDT", productType: "usdt-futures", leverage: 10, holdSide: "long" }, { config, client }
  );
  expect(server.getState().leverage.get("BTCUSDT")).toBe(10);
});
```

**Step 3: Create `account.test.ts`**

```ts
import { test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { MockServer } from "bitget-test-utils";
import { loadConfig, buildTools, BitgetRestClient } from "bitget-core";
import type { ToolSpec } from "bitget-core";

let server: MockServer;
let tools: ToolSpec[];
let config: ReturnType<typeof loadConfig>;
let client: BitgetRestClient;

beforeAll(async () => {
  server = new MockServer();
  const port = await server.start();
  process.env["BITGET_API_BASE_URL"] = `http://localhost:${port}`;
  process.env["BITGET_API_KEY"] = "test-key";
  process.env["BITGET_SECRET_KEY"] = "test-secret";
  process.env["BITGET_PASSPHRASE"] = "test-passphrase";
  config = loadConfig({ modules: "account", readOnly: false });
  client = new BitgetRestClient(config);
  tools = buildTools(config);
});
beforeEach(() => server.reset());
afterAll(() => server.stop());

function getTool(name: string): ToolSpec {
  return tools.find((t) => t.name === name)!;
}

test("get_account_assets returns seeded USDT balance", async () => {
  const result = await getTool("get_account_assets").handler(
    { accountType: "spot", coin: "USDT" }, { config, client }
  ) as Record<string, unknown>;
  const data = result["data"] as Array<Record<string, unknown>>;
  expect(data.some((b) => b["coin"] === "USDT" && b["available"] === "10000")).toBe(true);
});

test("account_transfer creates transfer record", async () => {
  await getTool("account_transfer").handler(
    { coin: "USDT", size: "100", fromType: "spot", toType: "funding" }, { config, client }
  );
  expect(server.getState().transfers.length).toBe(1);
});

test("account_get_deposit_address returns mock address", async () => {
  const result = await getTool("account_get_deposit_address").handler(
    { coin: "USDT", chain: "TRC20" }, { config, client }
  ) as Record<string, unknown>;
  const data = result["data"] as Record<string, unknown>;
  expect(typeof data["address"]).toBe("string");
});
```

**Step 4: Create `remaining-modules.test.ts`**

```ts
import { test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { MockServer } from "bitget-test-utils";
import { loadConfig, buildTools, BitgetRestClient } from "bitget-core";
import type { ToolSpec } from "bitget-core";

let server: MockServer;
let tools: ToolSpec[];
let config: ReturnType<typeof loadConfig>;
let client: BitgetRestClient;

beforeAll(async () => {
  server = new MockServer();
  const port = await server.start();
  process.env["BITGET_API_BASE_URL"] = `http://localhost:${port}`;
  process.env["BITGET_API_KEY"] = "test-key";
  process.env["BITGET_SECRET_KEY"] = "test-secret";
  process.env["BITGET_PASSPHRASE"] = "test-passphrase";
  config = loadConfig({ modules: "all", readOnly: false });
  client = new BitgetRestClient(config);
  tools = buildTools(config);
});
beforeEach(() => server.reset());
afterAll(() => server.stop());

function getTool(name: string): ToolSpec {
  return tools.find((t) => t.name === name)!;
}

// Convert
test("convert_get_quote returns quoteId", async () => {
  const result = await getTool("convert_get_quote").handler(
    { fromCoin: "USDT", toCoin: "BTC", fromAmount: "100" }, { config, client }
  ) as Record<string, unknown>;
  const data = result["data"] as Record<string, unknown>;
  expect(typeof data["quoteId"]).toBe("string");
});

// Earn
test("earn_get_products returns seeded products", async () => {
  const result = await getTool("earn_manage").handler(
    { action: "products" }, { config, client }
  ) as Record<string, unknown>;
  expect(Array.isArray(result["data"])).toBe(true);
});

// Broker
test("broker_get_info returns broker info", async () => {
  const result = await getTool("broker_manage").handler(
    { action: "info" }, { config, client }
  ) as Record<string, unknown>;
  const data = result["data"] as Record<string, unknown>;
  expect(data["brokerId"]).toBeDefined();
});
```

**Step 5: Create `packages/bitget-core/tests/client/errors.test.ts`**

```ts
import { test, expect } from "vitest";
import { toToolErrorPayload, BitgetApiError, ConfigError, ValidationError } from "bitget-core";

test("toToolErrorPayload wraps BitgetApiError to nested shape", () => {
  const err = new BitgetApiError("Insufficient balance", { code: "40786" });
  const payload = toToolErrorPayload(err);
  expect(payload.ok).toBe(false);
  expect(payload.error.type).toBe("BitgetApiError");
  expect(payload.error.code).toBe("40786");
  expect(payload.error.message).toBe("Insufficient balance");
  expect(typeof payload.timestamp).toBe("string");
});

test("toToolErrorPayload wraps generic Error as InternalError", () => {
  const err = new Error("Something broke");
  const payload = toToolErrorPayload(err);
  expect(payload.ok).toBe(false);
  expect(payload.error.type).toBe("InternalError");
  expect(payload.error.message).toBe("Something broke");
});

test("toToolErrorPayload wraps ConfigError", () => {
  const err = new ConfigError("Missing credentials", "Set env vars");
  const payload = toToolErrorPayload(err);
  expect(payload.error.type).toBe("ConfigError");
  expect(payload.error.suggestion).toBe("Set env vars");
});

test("toToolErrorPayload wraps ValidationError", () => {
  const err = new ValidationError("orders must be an array");
  const payload = toToolErrorPayload(err);
  expect(payload.error.type).toBe("ValidationError");
});
```

**Step 6: Run tests**

```bash
cd packages/bitget-core && pnpm test
```

Expected: all tests pass.

**Step 7: Commit**

```bash
git add packages/bitget-core/tests/
git commit -m "test(bitget-core): add futures, account, module, and error payload tests"
```

---

### Task 12: bitget-mcp server tests

**Files:**
- Create: `packages/bitget-mcp/tests/server.test.ts`

**Step 1: Create `packages/bitget-mcp/tests/server.test.ts`**

The MCP server uses `StdioServerTransport`. For testing, use `InMemoryTransport` from the MCP SDK (connects two ends of a channel in-process).

```ts
import { test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { MockServer } from "bitget-test-utils";
import { loadConfig } from "bitget-core";
import { createServer } from "../src/server.js";

let mockServer: MockServer;
let mcpClient: Client;

beforeAll(async () => {
  mockServer = new MockServer();
  const port = await mockServer.start();
  process.env["BITGET_API_BASE_URL"] = `http://localhost:${port}`;
  process.env["BITGET_API_KEY"] = "test-key";
  process.env["BITGET_SECRET_KEY"] = "test-secret";
  process.env["BITGET_PASSPHRASE"] = "test-passphrase";

  const config = loadConfig({ modules: "spot,account", readOnly: false });
  const server = createServer(config);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  mcpClient = new Client({ name: "test-client", version: "1.0" }, { capabilities: {} });
  await mcpClient.connect(clientTransport);
});

beforeEach(() => mockServer.reset());
afterAll(async () => {
  await mcpClient.close();
  await mockServer.stop();
});

test("list_tools returns spot tools and system_get_capabilities", async () => {
  const result = await mcpClient.listTools();
  const names = result.tools.map((t) => t.name);
  expect(names).toContain("spot_get_ticker");
  expect(names).toContain("system_get_capabilities");
});

test("call_tool spot_get_ticker returns ok:true response", async () => {
  const result = await mcpClient.callTool({ name: "spot_get_ticker", arguments: { symbol: "BTCUSDT" } });
  const text = (result.content[0] as { text: string }).text;
  const parsed = JSON.parse(text) as Record<string, unknown>;
  expect(parsed["ok"]).toBe(true);
  expect(parsed["tool"]).toBe("spot_get_ticker");
});

test("call_tool with unknown tool returns isError:true", async () => {
  const result = await mcpClient.callTool({ name: "nonexistent_tool", arguments: {} });
  expect(result.isError).toBe(true);
  const text = (result.content[0] as { text: string }).text;
  const parsed = JSON.parse(text) as Record<string, unknown>;
  expect(parsed["ok"]).toBe(false);
});

test("system_get_capabilities returns capabilities snapshot", async () => {
  const result = await mcpClient.callTool({ name: "system_get_capabilities", arguments: {} });
  const text = (result.content[0] as { text: string }).text;
  const parsed = JSON.parse(text) as Record<string, unknown>;
  expect(parsed["ok"]).toBe(true);
  const data = parsed["data"] as Record<string, unknown>;
  expect(data["capabilities"]).toBeDefined();
});

test("call_tool with error injection returns isError:true with code", async () => {
  mockServer.setState({
    errorOverrides: new Map([["GET /api/v2/spot/market/tickers", { code: "40001", msg: "Rate limit exceeded" }]]),
  });
  const result = await mcpClient.callTool({ name: "spot_get_ticker", arguments: { symbol: "BTCUSDT" } });
  expect(result.isError).toBe(true);
});
```

**Step 2: Run tests**

```bash
cd packages/bitget-mcp && pnpm test
```

Expected: all 5 tests pass.

**Step 3: Commit**

```bash
git add packages/bitget-mcp/tests/server.test.ts
git commit -m "test(bitget-mcp): add MCP server integration tests with InMemoryTransport"
```

---

### Task 13: bitget-client CLI tests

**Files:**
- Create: `packages/bitget-client/tests/cli.test.ts`

**Step 1: Create `packages/bitget-client/tests/cli.test.ts`**

The CLI (`bgc`) is a Node.js script. Test it by spawning a child process with `node:child_process`.

```ts
import { test, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { MockServer } from "bitget-test-utils";

let server: MockServer;
let baseUrl: string;

const CLI_PATH = resolve(import.meta.dirname, "../../bitget-client/dist/index.js");

function runCli(args: string[], env?: Record<string, string>): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn("node", [CLI_PATH, ...args], {
      env: { ...process.env, ...env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    child.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

beforeAll(async () => {
  server = new MockServer();
  const port = await server.start();
  baseUrl = `http://localhost:${port}`;
});

afterAll(() => server.stop());

test("bgc --version exits 0 and prints version", async () => {
  const { stdout, code } = await runCli(["--version"], { BITGET_API_BASE_URL: baseUrl });
  expect(code).toBe(0);
  expect(stdout).toContain("bgc");
});

test("bgc --help exits 0", async () => {
  const { stdout, code } = await runCli(["--help"], { BITGET_API_BASE_URL: baseUrl });
  expect(code).toBe(0);
  expect(stdout).toContain("Usage:");
});

test("bgc spot spot_get_ticker --symbol BTCUSDT prints JSON", async () => {
  const { stdout, code } = await runCli(
    ["spot", "spot_get_ticker", "--symbol", "BTCUSDT"],
    { BITGET_API_BASE_URL: baseUrl }
  );
  expect(code).toBe(0);
  const parsed = JSON.parse(stdout) as Record<string, unknown>;
  expect(parsed["endpoint"]).toBeDefined();
  expect(parsed["data"]).toBeDefined();
});

test("bgc account get_account_assets writes error to stderr and exits 1 without credentials", async () => {
  const { stderr, code } = await runCli(
    ["account", "get_account_assets"],
    {
      BITGET_API_BASE_URL: baseUrl,
      BITGET_API_KEY: "",
      BITGET_SECRET_KEY: "",
      BITGET_PASSPHRASE: "",
    }
  );
  expect(code).toBe(1);
  expect(stderr).toContain("ok");
  const parsed = JSON.parse(stderr) as Record<string, unknown>;
  expect(parsed["ok"]).toBe(false);
});

test("bgc with unknown tool exits 1", async () => {
  const { stderr, code } = await runCli(
    ["spot", "nonexistent_tool"],
    { BITGET_API_BASE_URL: baseUrl }
  );
  expect(code).toBe(1);
  expect(stderr).toContain("nonexistent_tool");
});
```

**Step 2: Build bitget-client first** (the CLI test spawns the compiled JS):

```bash
cd packages/bitget-client && pnpm build
```

**Step 3: Run tests**

```bash
cd packages/bitget-client && pnpm test
```

Expected: all 5 tests pass.

**Step 4: Commit**

```bash
git add packages/bitget-client/tests/cli.test.ts
git commit -m "test(bitget-client): add CLI integration tests"
```

---

### Task 14: Root test script + final verification

**Step 1: Verify all packages typecheck**

```bash
pnpm -r run typecheck
```

Expected: zero errors across all packages.

**Step 2: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass across bitget-core, bitget-mcp, bitget-client.

**Step 3: Smoke-test standalone server**

```bash
node packages/bitget-test-utils/dist/bin/mock-server.js --port 3210 &
BITGET_API_BASE_URL=http://localhost:3210 node packages/bitget-client/dist/index.js spot spot_get_ticker --symbol BTCUSDT
kill %1
```

Expected: JSON output with BTCUSDT ticker data printed to stdout.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add root test script and finalize mock server setup"
```

---

## Summary

| Task | What it builds |
|---|---|
| 1 | `packages/bitget-test-utils` scaffold |
| 2 | State store types + fixture seeds |
| 3 | HTTP server core + router + route stubs |
| 4 | Spot market routes (5 endpoints) |
| 5 | Spot trade routes (15 endpoints) |
| 6 | Futures market + futures trade routes (~25 endpoints) |
| 7 | Account + margin + copy-trading + convert + earn + p2p + broker routes (~30 endpoints) |
| 8 | Public exports + standalone `bitget-mock-server` CLI |
| 9 | Vitest config in 3 consumer packages |
| 10 | bitget-core spot tests + error payload unit tests |
| 11 | bitget-core futures + account + remaining module tests |
| 12 | bitget-mcp MCP server integration tests |
| 13 | bitget-client CLI integration tests |
| 14 | Root test script + final verification |
