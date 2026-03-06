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
