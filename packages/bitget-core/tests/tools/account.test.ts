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
  config = loadConfig({ modules: "account", readOnly: false });
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

test("get_account_assets returns seeded USDT balance of 10000", async () => {
  const result = await getTool("get_account_assets").handler(
    { accountType: "spot", coin: "USDT" },
    { config, client },
  ) as Record<string, unknown>;
  const data = result["data"] as Array<Record<string, unknown>>;
  expect(Array.isArray(data)).toBe(true);
  expect(data.some((b) => b["coin"] === "USDT" && b["available"] === "10000")).toBe(true);
});

test("get_account_assets with accountType=all returns multiple coins", async () => {
  const result = await getTool("get_account_assets").handler(
    { accountType: "all" },
    { config, client },
  ) as Record<string, unknown>;
  const data = result["data"] as Array<Record<string, unknown>>;
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThanOrEqual(3);
});

test("transfer creates a transfer record in state", async () => {
  // transfer handler uses fromAccountType / toAccountType (converted internally to fromType/toType for API)
  await getTool("transfer").handler(
    { coin: "USDT", amount: "100", fromAccountType: "spot", toAccountType: "funding" },
    { config, client },
  );
  expect(server.getState().transfers.length).toBe(1);
  expect(server.getState().transfers[0]?.coin).toBe("USDT");
});

test("get_deposit_address returns mock address for USDT", async () => {
  const result = await getTool("get_deposit_address").handler(
    { coin: "USDT", chain: "TRC20" },
    { config, client },
  ) as Record<string, unknown>;
  const data = result["data"] as Record<string, unknown>;
  expect(typeof data["address"]).toBe("string");
  // mock server returns mock-${coin.toLowerCase()}-address-0x1234
  expect(data["address"]).toContain("usdt");
});

test("get_deposit_address returns address for BTC", async () => {
  const result = await getTool("get_deposit_address").handler(
    { coin: "BTC" },
    { config, client },
  ) as Record<string, unknown>;
  const data = result["data"] as Record<string, unknown>;
  expect(typeof data["address"]).toBe("string");
  expect(data["address"]).toContain("btc");
});
