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
    const subUid = nextId(state, "BSUB");
    state.brokerSubaccounts.set(subUid, { subUid, subName: (body["subName"] as string) ?? "sub", status: "normal" });
    return { subUid };
  });

  router.register("POST", "/api/v2/broker/account/modify-subaccount", (_req, body, _query, state) => {
    const subUid = body["subUid"] as string;
    const s = state.brokerSubaccounts.get(subUid);
    if (s && body["status"]) s.status = body["status"] as "normal" | "freeze";
    return { subUid };
  });

  router.register("GET", "/api/v2/broker/manage/subaccount-apikey-list", () => []);

  router.register("POST", "/api/v2/broker/manage/create-subaccount-apikey", (_req, body, _query, state) => ({
    subUid: body["subUid"],
    apiKey: "mock-broker-apikey-" + nextId(state, "BK"),
  }));

  router.register("POST", "/api/v2/broker/manage/modify-subaccount-apikey", (_req, body) => ({
    subUid: body["subUid"],
    apiKey: body["apiKey"],
  }));

  router.register("POST", "/api/v2/broker/manage/delete-subaccount-apikey", (_req, body) => ({
    subUid: body["subUid"],
    apiKey: body["apiKey"],
  }));
}
