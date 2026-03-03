import type { Router } from "../router.js";
import { SPOT_TICKERS } from "../fixtures.js";

export function registerSpotMarketRoutes(router: Router): void {
  // GET /api/v2/spot/market/tickers
  router.register("GET", "/api/v2/spot/market/tickers", (_req, _body, query) => {
    const symbol = query.get("symbol");
    const entries = Object.entries(SPOT_TICKERS);
    const filtered = symbol ? entries.filter(([s]) => s === symbol) : entries;
    return filtered.map(([sym, t]) => ({
      symbol: sym,
      lastPr: t.lastPr,
      bidPr: t.bidPr,
      askPr: t.askPr,
      change24h: t.change24h,
      high24h: t.askPr,
      low24h: t.bidPr,
      baseVolume: "1000",
      quoteVolume: "50000000",
      ts: Date.now().toString(),
    }));
  });

  // GET /api/v2/spot/market/orderbook
  router.register("GET", "/api/v2/spot/market/orderbook", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    const price = parseFloat(ticker.lastPr);
    return {
      asks: [[String(price + 1), "0.5"], [String(price + 2), "1.0"]],
      bids: [[String(price - 1), "0.5"], [String(price - 2), "1.0"]],
      ts: Date.now().toString(),
    };
  });

  // GET /api/v2/spot/market/merge-depth
  router.register("GET", "/api/v2/spot/market/merge-depth", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    const price = parseFloat(ticker.lastPr);
    return {
      asks: [[String(price + 10), "2.0"]],
      bids: [[String(price - 10), "2.0"]],
      ts: Date.now().toString(),
    };
  });

  // GET /api/v2/spot/market/candles
  router.register("GET", "/api/v2/spot/market/candles", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    const price = parseFloat(ticker.lastPr);
    return [[Date.now().toString(), String(price), String(price + 50), String(price - 50), String(price), "100", "5000000"]];
  });

  // GET /api/v2/spot/market/history-candles
  router.register("GET", "/api/v2/spot/market/history-candles", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    const price = parseFloat(ticker.lastPr);
    return [[String(Date.now() - 60000), String(price - 100), String(price), String(price - 200), String(price - 100), "80", "4000000"]];
  });

  // GET /api/v2/spot/market/fills
  router.register("GET", "/api/v2/spot/market/fills", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    return [{ tradeId: "t001", symbol, side: "buy", price: ticker.lastPr, size: "0.01", ts: Date.now().toString() }];
  });

  // GET /api/v2/spot/market/fills-history
  router.register("GET", "/api/v2/spot/market/fills-history", (_req, _body, query) => {
    const symbol = query.get("symbol") ?? "BTCUSDT";
    const ticker = SPOT_TICKERS[symbol] ?? SPOT_TICKERS["BTCUSDT"]!;
    return [{ tradeId: "t000", symbol, side: "sell", price: ticker.lastPr, size: "0.02", ts: String(Date.now() - 3600000) }];
  });

  // GET /api/v2/spot/public/symbols
  router.register("GET", "/api/v2/spot/public/symbols", () => {
    return Object.keys(SPOT_TICKERS).map((symbol) => ({
      symbol,
      baseCoin: symbol.replace("USDT", ""),
      quoteCoin: "USDT",
      status: "online",
      minTradeAmount: "0.0001",
      maxTradeAmount: "1000",
    }));
  });

  // GET /api/v2/spot/public/coins
  router.register("GET", "/api/v2/spot/public/coins", () => {
    return [
      { coin: "BTC", coinId: "1", chains: [{ chain: "BTC", withdrawFee: "0.0005" }] },
      { coin: "ETH", coinId: "2", chains: [{ chain: "ERC20", withdrawFee: "0.005" }] },
      { coin: "USDT", coinId: "3", chains: [{ chain: "TRC20", withdrawFee: "1" }] },
    ];
  });
}
