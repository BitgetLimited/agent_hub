import type { Router } from "../router.js";
import { FUTURES_TICKERS } from "../fixtures.js";

export function registerFuturesMarketRoutes(router: Router): void {
  const tickerHandler = (_req: unknown, _body: unknown, query: URLSearchParams) => {
    const symbol = query.get("symbol");
    const entries = Object.entries(FUTURES_TICKERS);
    const filtered = symbol ? entries.filter(([s]) => s === symbol) : entries;
    return filtered.map(([sym, t]) => ({
      symbol: sym,
      productType: t.productType,
      lastPr: t.lastPr,
      bidPr: t.bidPr,
      askPr: t.askPr,
      fundingRate: t.fundingRate,
      change24h: "0.01",
      high24h: t.lastPr,
      low24h: t.lastPr,
      holdingAmount: "5000",
      baseVolume: "200",
      quoteVolume: "10000000",
      ts: Date.now().toString(),
    }));
  };
  router.register("GET", "/api/v2/mix/market/ticker", tickerHandler);
  router.register("GET", "/api/v2/mix/market/tickers", tickerHandler);

  router.register("GET", "/api/v2/mix/market/merge-depth", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const t = FUTURES_TICKERS[symbol] ?? FUTURES_TICKERS["BTCUSDT"]!;
    const price = parseFloat(t.lastPr);
    return { asks: [[String(price + 5), "1.0"]], bids: [[String(price - 5), "1.0"]], ts: Date.now().toString() };
  });

  for (const path of [
    "/api/v2/mix/market/candles",
    "/api/v2/mix/market/history-candles",
    "/api/v2/mix/market/history-mark-candles",
    "/api/v2/mix/market/history-index-candles",
  ]) {
    router.register("GET", path, (_req, _body, query) => {
      const symbol = query.get("symbol") ?? "BTCUSDT";
      const t = FUTURES_TICKERS[symbol] ?? FUTURES_TICKERS["BTCUSDT"]!;
      const p = parseFloat(t.lastPr);
      return [[Date.now().toString(), String(p), String(p + 100), String(p - 100), String(p), "50", "2500000"]];
    });
  }

  router.register("GET", "/api/v2/mix/market/fills", () => []);
  router.register("GET", "/api/v2/mix/market/fills-history", () => []);

  router.register("GET", "/api/v2/mix/market/contracts", (_req, _body, query) => {
    const productType = query.get("productType") ?? "usdt-futures";
    return Object.keys(FUTURES_TICKERS).map((sym) => ({
      symbol: sym,
      productType,
      baseCoin: sym.replace("USDT", ""),
      quoteCoin: "USDT",
      status: "normal",
      minTradeNum: "0.001",
      volumePlace: "3",
    }));
  });

  router.register("GET", "/api/v2/mix/market/history-fund-rate", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const t = FUTURES_TICKERS[symbol] ?? FUTURES_TICKERS["BTCUSDT"]!;
    return [{ symbol, fundingRate: t.fundingRate, settleTime: Date.now().toString() }];
  });
  router.register("GET", "/api/v2/mix/market/current-fund-rate", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const t = FUTURES_TICKERS[symbol] ?? FUTURES_TICKERS["BTCUSDT"]!;
    return [{ symbol, fundingRate: t.fundingRate }];
  });
  router.register("GET", "/api/v2/mix/market/funding-time", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    return [{ symbol, fundingTime: Date.now().toString(), interval: "8h" }];
  });

  router.register("GET", "/api/v2/mix/market/open-interest", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    return [{ symbol, openInterestList: [{ openInterestValue: "500000000" }] }];
  });
}
