import type { Router } from "../router.js";
import { nextId } from "../state.js";

export function registerAccountRoutes(router: Router): void {
  router.register("GET", "/api/v2/spot/account/assets", (_req, _body, query, state) => {
    const coin = query.get("coin");
    const balances = [...state.balances.values()];
    return coin ? balances.filter((b) => b.coin === coin) : balances;
  });

  router.register("GET", "/api/v2/mix/account/accounts", (_req, _body, _query, state) => {
    const usdt = state.balances.get("USDT");
    return [{ marginCoin: "USDT", available: usdt?.available ?? "0", frozen: usdt?.frozen ?? "0" }];
  });

  router.register("GET", "/api/v2/account/funding-assets", (_req, _body, _query, state) => {
    return [...state.balances.values()].map((b) => ({ coin: b.coin, available: b.available }));
  });

  router.register("GET", "/api/v2/account/all-account-balance", (_req, _body, _query, state) => {
    return [...state.balances.values()];
  });

  router.register("GET", "/api/v2/spot/account/bills", () => []);
  router.register("GET", "/api/v2/mix/account/bill", () => []);

  router.register("POST", "/api/v2/spot/wallet/transfer", (_req, body, _query, state) => {
    const transferId = nextId(state, "TXF");
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

  router.register("POST", "/api/v2/spot/wallet/subaccount-transfer", (_req, body, _query, state) => {
    const transferId = nextId(state, "STXF");
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

  router.register("POST", "/api/v2/spot/wallet/withdrawal", (_req, body, _query, state) => {
    const withdrawalId = nextId(state, "WD");
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

  router.register("POST", "/api/v2/spot/wallet/cancel-withdrawal", (_req, body, _query, state) => {
    const id = body["withdrawalId"] as string;
    const w = state.withdrawals.get(id);
    if (w) w.status = "cancelled";
    return { withdrawalId: id };
  });

  router.register("GET", "/api/v2/spot/wallet/deposit-address", (_req, _body, query) => {
    const coin = query.get("coin") ?? "USDT";
    return { coin, address: `mock-${coin.toLowerCase()}-address-0x1234`, chain: "TRC20" };
  });

  router.register("GET", "/api/v2/spot/wallet/deposit-records", (_req, _body, _query, state) => state.deposits);
  router.register("GET", "/api/v2/spot/wallet/withdrawal-records", (_req, _body, _query, state) => [...state.withdrawals.values()]);
  router.register("GET", "/api/v2/spot/account/sub-main-trans-record", (_req, _body, _query, state) => state.transfers);

  router.register("GET", "/api/v2/user/virtual-subaccount-list", (_req, _body, _query, state) => [...state.subaccounts.values()]);
  router.register("GET", "/api/v2/user/virtual-subaccount-apikey-list", () => []);

  for (const path of [
    "/api/v2/user/create-virtual-subaccount",
    "/api/v2/user/modify-virtual-subaccount",
  ]) {
    router.register("POST", path, (_req, body, _query, state) => {
      const subUid = (body["subUid"] as string) ?? nextId(state, "SUB");
      state.subaccounts.set(subUid, {
        subUid,
        subName: (body["subName"] as string) ?? "subaccount",
        status: "normal",
      });
      return { subUid };
    });
  }

  for (const path of [
    "/api/v2/user/create-virtual-subaccount-apikey",
    "/api/v2/user/modify-virtual-subaccount-apikey",
  ]) {
    router.register("POST", path, (_req, body, _query, state) => ({
      subUid: body["subUid"],
      apiKey: "mock-apikey-" + nextId(state, "K"),
    }));
  }
}
