import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Router } from "./router.js";
import { createEmptyState, type MockState, type SpotOrder, nextId } from "./state.js";
import { seedState } from "./fixtures.js";
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
      const srv = this.server;
      this.server = null;
      srv.close((err) => (err ? reject(err) : resolve()));
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
    const orderId = order.orderId ?? nextId(this.state, "ORDER");
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
