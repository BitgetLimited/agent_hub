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
  process.env["BITGET_API_KEY"] = "test-key";
  process.env["BITGET_SECRET_KEY"] = "test-secret";
  process.env["BITGET_PASSPHRASE"] = "test-passphrase";
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

describe("spot_place_order -> spot_get_orders round-trip", () => {
  test("placed order appears in get_orders with status live", async () => {
    const place = getTool("spot_place_order");
    const get = getTool("spot_get_orders");

    // spot_place_order takes { orders: [...] } — single item goes to /place-order
    const placeResult = await place.handler(
      { orders: [{ symbol: "BTCUSDT", side: "buy", orderType: "limit", price: "49000", size: "0.001" }] },
      { config, client },
    ) as Record<string, unknown>;

    const placeData = placeResult["data"] as Record<string, unknown>;
    const orderId = placeData["orderId"] as string;
    expect(orderId).toBeTruthy();

    // spot_get_orders with no orderId returns open orders
    const getResult = await get.handler({ symbol: "BTCUSDT" }, { config, client }) as Record<string, unknown>;
    const orders = getResult["data"] as Array<Record<string, unknown>>;
    expect(orders.some((o) => o["orderId"] === orderId)).toBe(true);
  });
});

describe("spot_cancel_orders", () => {
  test("cancelling by orderId changes status to cancelled in state", async () => {
    // Seed an order directly into mock state
    const orderId = server.seedOrder({ symbol: "BTCUSDT", side: "buy", status: "live", price: "49000", size: "0.001" });

    const cancel = getTool("spot_cancel_orders");
    // spot_cancel_orders: flat args with symbol + orderId (NOT orders array)
    await cancel.handler({ symbol: "BTCUSDT", orderId }, { config, client });

    const order = server.getState().spotOrders.get(orderId);
    expect(order?.status).toBe("cancelled");
  });

  test("cancelAll cancels all live orders for symbol", async () => {
    server.seedOrder({ symbol: "BTCUSDT", side: "buy", status: "live" });
    server.seedOrder({ symbol: "BTCUSDT", side: "sell", status: "live" });

    const cancel = getTool("spot_cancel_orders");
    await cancel.handler({ symbol: "BTCUSDT", cancelAll: true }, { config, client });

    const remaining = [...server.getState().spotOrders.values()].filter(
      (o) => o.symbol === "BTCUSDT" && o.status === "live",
    );
    expect(remaining.length).toBe(0);
  });
});

describe("error injection", () => {
  test("errorOverride causes the rest-client to throw a BitgetApiError", async () => {
    server.setState({
      errorOverrides: new Map([
        ["POST /api/v2/spot/trade/place-order", { code: "40786", msg: "Insufficient balance" }],
      ]),
    });

    const place = getTool("spot_place_order");
    await expect(
      place.handler(
        { orders: [{ symbol: "BTCUSDT", side: "buy", orderType: "limit", price: "49000", size: "999999" }] },
        { config, client },
      ),
    ).rejects.toThrow();
  });
});
