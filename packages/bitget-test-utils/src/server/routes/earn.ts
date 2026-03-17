import type { Router } from "../router.js";
import { nextId } from "../state.js";

export function registerEarnRoutes(router: Router): void {
  router.register("GET", "/api/v2/earn/savings/product", (_req, _body, _query, state) => state.earnProducts);

  router.register("GET", "/api/v2/earn/savings/assets", (_req, _body, _query, state) => [...state.earnHoldings.values()]);

  router.register("POST", "/api/v2/earn/savings/subscribe", (_req, body, _query, state) => {
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

  router.register("POST", "/api/v2/earn/savings/redeem", (_req, body, _query, state) => {
    const holdingId = body["holdingId"] as string;
    const h = state.earnHoldings.get(holdingId);
    if (h) h.status = "redeemed";
    return { holdingId };
  });
}
