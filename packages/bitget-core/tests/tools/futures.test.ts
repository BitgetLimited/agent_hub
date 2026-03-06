import { test, expect, beforeAll, beforeEach, afterAll } from "vitest";
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
  process.env["BITGET_API_KEY"] = "test-key";
  process.env["BITGET_SECRET_KEY"] = "test-secret";
  process.env["BITGET_PASSPHRASE"] = "test-passphrase";
  config = loadConfig({ modules: "futures", readOnly: false });
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

test("futures_get_ticker returns BTCUSDT data with lastPr 50100", async () => {
  const result = await getTool("futures_get_ticker").handler(
    { symbol: "BTCUSDT", productType: "USDT-FUTURES" },
    { config, client },
  ) as Record<string, unknown>;
  const data = result["data"] as Array<Record<string, unknown>>;
  expect(Array.isArray(data)).toBe(true);
  expect(data[0]?.["lastPr"]).toBe("50100");
});

test("futures_get_contracts returns a contract list", async () => {
  const result = await getTool("futures_get_contracts").handler(
    { productType: "USDT-FUTURES" },
    { config, client },
  ) as Record<string, unknown>;
  expect(Array.isArray(result["data"])).toBe(true);
});

test("futures_place_order -> futures_get_orders round-trip", async () => {
  // futures_place_order: orders array; each order needs symbol, productType, side, tradeSide, orderType
  const placeResult = await getTool("futures_place_order").handler(
    {
      orders: [{
        symbol: "BTCUSDT",
        productType: "USDT-FUTURES",
        side: "buy",
        tradeSide: "open",
        orderType: "limit",
        price: "49000",
        size: "0.001",
      }],
    },
    { config, client },
  ) as Record<string, unknown>;

  const placeData = placeResult["data"] as Record<string, unknown>;
  const orderId = placeData["orderId"] as string;
  expect(orderId).toBeTruthy();

  // futures_get_orders requires productType; returns open orders
  const ordersResult = await getTool("futures_get_orders").handler(
    { productType: "USDT-FUTURES", symbol: "BTCUSDT" },
    { config, client },
  ) as Record<string, unknown>;

  const orders = ordersResult["data"] as Array<Record<string, unknown>>;
  expect(Array.isArray(orders)).toBe(true);
  expect(orders.some((o) => o["orderId"] === orderId)).toBe(true);
});

test("futures_cancel_orders cancels a live order by orderId", async () => {
  // Place an order first
  const placeResult = await getTool("futures_place_order").handler(
    {
      orders: [{
        symbol: "BTCUSDT",
        productType: "USDT-FUTURES",
        side: "buy",
        tradeSide: "open",
        orderType: "limit",
        price: "48000",
        size: "0.001",
      }],
    },
    { config, client },
  ) as Record<string, unknown>;
  const orderId = ((placeResult["data"] as Record<string, unknown>)["orderId"]) as string;

  // futures_cancel_orders: flat args with productType + symbol + orderId
  await getTool("futures_cancel_orders").handler(
    { productType: "USDT-FUTURES", symbol: "BTCUSDT", orderId },
    { config, client },
  );

  const order = server.getState().futuresOrders.get(orderId);
  expect(order?.status).toBe("cancelled");
});

test("futures_get_positions returns positions array", async () => {
  const result = await getTool("futures_get_positions").handler(
    { productType: "USDT-FUTURES" },
    { config, client },
  ) as Record<string, unknown>;
  expect(Array.isArray(result["data"])).toBe(true);
});

test("futures_set_leverage stores leverage in state", async () => {
  await getTool("futures_set_leverage").handler(
    { productType: "USDT-FUTURES", symbol: "BTCUSDT", marginCoin: "USDT", leverage: "20" },
    { config, client },
  );

  const lev = server.getState().leverage.get("BTCUSDT");
  expect(lev).toBe(20);
});
