import type { Router } from "../router.js";
import { nextId } from "../state.js";
import type { MockState } from "../state.js";

export function registerConvertRoutes(router: Router): void {
  router.register("GET", "/api/v2/convert/currencies", () => {
    return [
      { fromCoin: "BTC", toCoin: "USDT", minTradeAmount: "0.0001" },
      { fromCoin: "ETH", toCoin: "USDT", minTradeAmount: "0.001" },
      { fromCoin: "USDT", toCoin: "BTC", minTradeAmount: "10" },
    ];
  });

  const makeQuote = (state: MockState, fromCoin: string, toCoin: string, fromAmount: string) => {
    const quoteId = nextId(state, "QUOTE");
    const quote = {
      quoteId,
      fromCoin,
      toCoin,
      fromSize: fromAmount,
      toSize: toCoin === "BTC" ? "0.002" : "1",
      price: "50000",
      expireTime: String(Date.now() + 30000),
    };
    state.convertQuotes.set(quoteId, quote);
    return quote;
  };

  router.register("GET", "/api/v2/convert/quoted-price", (_req, _body, query, state) => {
    return makeQuote(state, query.get("fromCoin") ?? "USDT", query.get("toCoin") ?? "BTC", query.get("fromAmount") ?? "100");
  });

  router.register("POST", "/api/v2/convert/quoted-price", (_req, body, _query, state) => {
    return makeQuote(state, (body["fromCoin"] as string) ?? "USDT", (body["toCoin"] as string) ?? "BTC", (body["fromAmount"] as string) ?? "100");
  });

  router.register("POST", "/api/v2/convert/trade", (_req, body, _query, state) => {
    const quoteId = body["quoteId"] as string;
    const quote = state.convertQuotes.get(quoteId);
    const tradeId = nextId(state, "CVT");
    state.convertHistory.push({
      tradeId,
      fromCoin: quote?.fromCoin ?? "USDT",
      toCoin: quote?.toCoin ?? "BTC",
      fromSize: quote?.fromSize ?? "0",
      toSize: quote?.toSize ?? "0",
      status: "success",
      cTime: Date.now().toString(),
    });
    return { tradeId, status: "success" };
  });

  router.register("POST", "/api/v2/convert/bgb-convert", (_req, _body, _query, state) => {
    const tradeId = nextId(state, "BGBCVT");
    state.convertHistory.push({ tradeId, fromCoin: "BGB", toCoin: "USDT", fromSize: "100", toSize: "50", status: "success", cTime: Date.now().toString() });
    return { tradeId, status: "success" };
  });

  router.register("GET", "/api/v2/convert/convert-record", (_req, _body, _query, state) => state.convertHistory);
  router.register("GET", "/api/v2/convert/bgb-convert-records", (_req, _body, _query, state) => state.convertHistory.filter((r) => r.fromCoin === "BGB"));
}
