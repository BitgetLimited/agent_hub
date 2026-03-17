import type { Router } from "../router.js";
import { nextId } from "../state.js";
import type { FuturesOrder } from "../state.js";

export function registerFuturesTradeRoutes(router: Router): void {
  router.register("POST", "/api/v2/mix/order/place-order", (_req, body, _query, state) => {
    const orderId = nextId(state, "FORDER");
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

  router.register("POST", "/api/v2/mix/order/batch-place-order", (_req, body, _query, state) => {
    const orderList = Array.isArray(body["orderList"])
      ? (body["orderList"] as Record<string, unknown>[])
      : [];
    const result = orderList.map((o) => {
      const orderId = nextId(state, "FORDER");
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

  router.register("POST", "/api/v2/mix/order/cancel-order", (_req, body, _query, state) => {
    const orderId = body["orderId"] as string;
    const order = state.futuresOrders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    order.status = "cancelled";
    order.uTime = Date.now().toString();
    return { orderId };
  });

  router.register("POST", "/api/v2/mix/order/batch-cancel-orders", (_req, body, _query, state) => {
    const orderIdList = (body["orderIdList"] as { orderId: string }[]) ?? [];
    const orderIds = orderIdList.map((item) => item.orderId);
    orderIds.forEach((id) => {
      const o = state.futuresOrders.get(id);
      if (o) { o.status = "cancelled"; o.uTime = Date.now().toString(); }
    });
    return { successList: orderIds.map((id) => ({ orderId: id })), failureList: [] };
  });

  router.register("POST", "/api/v2/mix/order/cancel-all-orders", (_req, _body, _query, state) => {
    for (const o of state.futuresOrders.values()) {
      if (o.status === "live") { o.status = "cancelled"; o.uTime = Date.now().toString(); }
    }
    return {};
  });

  router.register("GET", "/api/v2/mix/order/detail", (_req, _body, query, state) => {
    const orderId = query.get("orderId");
    return orderId ? (state.futuresOrders.get(orderId) ?? null) : null;
  });

  router.register("GET", "/api/v2/mix/order/orders-pending", (_req, _body, query, state) => {
    const symbol = query.get("symbol");
    return [...state.futuresOrders.values()].filter((o) => o.status === "live" && (!symbol || o.symbol === symbol));
  });

  router.register("GET", "/api/v2/mix/order/orders-history", (_req, _body, query, state) => {
    const symbol = query.get("symbol");
    return [...state.futuresOrders.values()].filter((o) => o.status !== "live" && (!symbol || o.symbol === symbol));
  });

  router.register("GET", "/api/v2/mix/order/fills", () => []);
  router.register("GET", "/api/v2/mix/order/fill-history", () => []);

  router.register("GET", "/api/v2/mix/position/all-position", (_req, _body, _query, state) => {
    return [...state.positions.values()];
  });

  router.register("GET", "/api/v2/mix/position/single-position", (_req, _body, query, state) => {
    const symbol = query.get("symbol");
    return [...state.positions.values()].filter((p) => !symbol || p.symbol === symbol);
  });

  router.register("GET", "/api/v2/mix/position/history-position", () => []);

  router.register("POST", "/api/v2/mix/account/set-leverage", (_req, body, _query, state) => {
    const symbol = body["symbol"] as string;
    const leverage = Number(body["leverage"]);
    state.leverage.set(symbol, leverage);
    return { symbol, leverage: String(leverage) };
  });

  router.register("POST", "/api/v2/mix/account/set-margin-mode", (_req, body) => {
    return { symbol: body["symbol"], marginMode: body["marginMode"] };
  });

  router.register("POST", "/api/v2/mix/account/set-position-mode", (_req, body) => {
    return { productType: body["productType"], posMode: body["posMode"] };
  });

  router.register("POST", "/api/v2/mix/account/set-auto-margin", (_req, body) => {
    return { symbol: body["symbol"], autoMargin: body["autoMargin"] };
  });
}
