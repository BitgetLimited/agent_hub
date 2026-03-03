import { describe, test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { MockServer } from "bitget-test-utils";
import { loadConfig, buildTools, BitgetRestClient } from "bitget-core";
import type { ToolSpec } from "bitget-core";

let server: MockServer;
let tools: ToolSpec[];
let config: ReturnType<typeof loadConfig>;
let client: BitgetRestClient;

beforeAll(async () => {
  server = new MockServer();
  const port = await server.start();
  process.env["BITGET_API_BASE_URL"] = `http://localhost:${port}`;
  config = loadConfig({ modules: "spot", readOnly: false });
  client = new BitgetRestClient(config);
  tools = buildTools(config);
});

beforeEach(() => server.reset());
afterAll(() => server.stop());

function getTool(name: string): ToolSpec {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
}

describe("spot_get_ticker", () => {
  test("returns seeded BTCUSDT ticker with lastPr 50000", async () => {
    const tool = getTool("spot_get_ticker");
    const result = await tool.handler({ symbol: "BTCUSDT" }, { config, client }) as Record<string, unknown>;
    expect(Array.isArray(result["data"])).toBe(true);
    const tickers = result["data"] as Array<Record<string, unknown>>;
    expect(tickers[0]?.["lastPr"]).toBe("50000");
  });

  test("returns all 3 tickers when no symbol", async () => {
    const tool = getTool("spot_get_ticker");
    const result = await tool.handler({}, { config, client }) as Record<string, unknown>;
    const tickers = result["data"] as Array<Record<string, unknown>>;
    expect(tickers.length).toBe(3);
  });
});

describe("spot_get_depth", () => {
  test("returns orderbook for BTCUSDT with asks and bids", async () => {
    const tool = getTool("spot_get_depth");
    const result = await tool.handler({ symbol: "BTCUSDT" }, { config, client }) as Record<string, unknown>;
    const data = result["data"] as Record<string, unknown>;
    expect(Array.isArray(data["asks"])).toBe(true);
    expect(Array.isArray(data["bids"])).toBe(true);
    expect((data["asks"] as unknown[]).length).toBeGreaterThan(0);
    expect((data["bids"] as unknown[]).length).toBeGreaterThan(0);
  });
});

describe("spot_get_candles", () => {
  test("returns candle data array", async () => {
    const tool = getTool("spot_get_candles");
    const result = await tool.handler({ symbol: "BTCUSDT", granularity: "1min" }, { config, client }) as Record<string, unknown>;
    expect(Array.isArray(result["data"])).toBe(true);
    expect((result["data"] as unknown[]).length).toBeGreaterThan(0);
  });
});

describe("spot_get_trades", () => {
  test("returns trades array for BTCUSDT", async () => {
    const tool = getTool("spot_get_trades");
    const result = await tool.handler({ symbol: "BTCUSDT" }, { config, client }) as Record<string, unknown>;
    expect(Array.isArray(result["data"])).toBe(true);
    expect((result["data"] as unknown[]).length).toBeGreaterThan(0);
  });
});

describe("spot_get_symbols", () => {
  test("returns symbols list containing BTCUSDT", async () => {
    const tool = getTool("spot_get_symbols");
    const result = await tool.handler({}, { config, client }) as Record<string, unknown>;
    const symbols = result["data"] as Array<Record<string, unknown>>;
    expect(symbols.some((s) => s["symbol"] === "BTCUSDT")).toBe(true);
  });

  test("returns coins list when type=coins", async () => {
    const tool = getTool("spot_get_symbols");
    const result = await tool.handler({ type: "coins" }, { config, client }) as Record<string, unknown>;
    const coins = result["data"] as Array<Record<string, unknown>>;
    expect(coins.some((c) => c["coin"] === "BTC")).toBe(true);
  });
});
