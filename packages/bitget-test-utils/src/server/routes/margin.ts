import type { Router } from "../router.js";
import { nextId } from "../state.js";
import type { MarginOrder } from "../state.js";

export function registerMarginRoutes(router: Router): void {
  for (const scope of ["cross", "isolated"] as const) {
    router.register("POST", `/api/v2/margin/${scope}/place-order`, (_req, body, _query, state) => {
      const orderId = nextId(state, "MORDER");
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

    router.register("POST", `/api/v2/margin/${scope}/cancel-order`, (_req, body, _query, state) => {
      const orderId = body["orderId"] as string;
      const order = state.marginOrders.get(orderId);
      if (!order) throw new Error(`Margin order ${orderId} not found`);
      order.status = "cancelled";
      return { orderId };
    });

    router.register("GET", `/api/v2/margin/${scope}/open-orders`, (_req, _body, _query, state) => {
      return [...state.marginOrders.values()].filter((o) => o.status === "live");
    });

    router.register("GET", `/api/v2/margin/${scope}/history-orders`, (_req, _body, _query, state) => {
      return [...state.marginOrders.values()].filter((o) => o.status !== "live");
    });

    router.register("GET", `/api/v2/margin/${scope}/account`, (_req, _body, _query, state) => {
      const usdt = state.balances.get("USDT");
      return { marginCoin: "USDT", available: usdt?.available ?? "0", risk: "0.1" };
    });

    router.register("GET", `/api/v2/margin/${scope}/interest-history`, () => []);
    router.register("GET", `/api/v2/margin/${scope}/liquidation-history`, () => []);
  }
}
