import type { Router } from "../router.js";
import { nextId } from "../state.js";
import type { SpotOrder } from "../state.js";

export function registerSpotTradeRoutes(router: Router): void {
  // POST /api/v2/spot/trade/place-order (single)
  router.register("POST", "/api/v2/spot/trade/place-order", (_req, body, _query, state) => {
    const orderId = nextId(state, "ORDER");
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
    const orderList = Array.isArray(body["orderList"])
      ? (body["orderList"] as Record<string, unknown>[])
      : [];
    const result = orderList.map((o) => {
      const orderId = nextId(state, "ORDER");
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
    const orderList = (body["orderList"] as { orderId: string }[]) ?? [];
    const successList = orderList.map(({ orderId }) => {
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
    const newId = nextId(state, "ORDER");
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
    if (!orderId) throw new Error("orderId is required");
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
    const orderId = nextId(state, "PLAN");
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
    const symbolList = (body["symbolList"] as string[]) ?? [];
    for (const order of state.spotPlanOrders.values()) {
      if (symbolList.length === 0 || symbolList.includes(order.symbol)) order.status = "cancelled";
    }
    return { symbolList };
  });
}
