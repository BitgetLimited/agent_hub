import type { MockState } from "./state.js";

export const SPOT_TICKERS: Record<string, { lastPr: string; bidPr: string; askPr: string; change24h: string }> = {
  BTCUSDT: { lastPr: "50000", bidPr: "49999", askPr: "50001", change24h: "0.02" },
  ETHUSDT: { lastPr: "3000",  bidPr: "2999",  askPr: "3001",  change24h: "0.01" },
  SOLUSDT: { lastPr: "150",   bidPr: "149.9", askPr: "150.1", change24h: "-0.005" },
};

export const FUTURES_TICKERS: Record<string, { lastPr: string; bidPr: string; askPr: string; fundingRate: string; productType: string }> = {
  BTCUSDT: { lastPr: "50100", bidPr: "50099", askPr: "50101", fundingRate: "0.0001", productType: "usdt-futures" },
  ETHUSDT: { lastPr: "3010",  bidPr: "3009",  askPr: "3011",  fundingRate: "0.00008", productType: "usdt-futures" },
};

/** Mutates `state` in place with default fixture balances and earn products. */
export function seedState(state: MockState): void {
  // Default balances
  state.balances.set("USDT", { coin: "USDT", available: "10000", frozen: "0" });
  state.balances.set("BTC",  { coin: "BTC",  available: "1",     frozen: "0" });
  state.balances.set("ETH",  { coin: "ETH",  available: "10",    frozen: "0" });

  // Default earn products
  state.earnProducts = [
    { productId: "earn001", coin: "USDT", productType: "flexible", apy: "0.05",  minAmount: "10" },
    { productId: "earn002", coin: "BTC",  productType: "flexible", apy: "0.02",  minAmount: "0.001" },
    { productId: "earn003", coin: "USDT", productType: "fixed",    apy: "0.08",  minAmount: "100", term: 30 },
    { productId: "earn004", coin: "ETH",  productType: "fixed",    apy: "0.04",  minAmount: "0.1", term: 14 },
    { productId: "earn005", coin: "USDT", productType: "fixed",    apy: "0.12",  minAmount: "1000", term: 90 },
  ];
}
