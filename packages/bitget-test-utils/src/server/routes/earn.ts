import type { Router } from "../router.js";
import { nextId } from "../state.js";

export function registerEarnRoutes(router: Router): void {
  for (const path of ["/api/v2/earn/product/list", "/api/v2/earn/saving/product/list"]) {
    router.register("GET", path, (_req, _body, _query, state) => state.earnProducts);
  }

  for (const path of ["/api/v2/earn/holding/list", "/api/v2/earn/saving/holding/list"]) {
    router.register("GET", path, (_req, _body, _query, state) => [...state.earnHoldings.values()]);
  }

  router.register("POST", "/api/v2/earn/subscribe", (_req, body, _query, state) => {
    const holdingId = nextId(state, "EARN");
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

  router.register("POST", "/api/v2/earn/redeem", (_req, body, _query, state) => {
    const holdingId = body["holdingId"] as string;
    const h = state.earnHoldings.get(holdingId);
    if (h) h.status = "redeemed";
    return { holdingId };
  });
}
