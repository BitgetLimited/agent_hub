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
