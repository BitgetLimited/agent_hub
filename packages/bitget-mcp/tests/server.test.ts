import { test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { MockServer } from "bitget-test-utils";
import { loadConfig } from "bitget-core";
import { createServer } from "../src/server.js";

let mockServer: MockServer;
let mcpClient: Client;

beforeAll(async () => {
  mockServer = new MockServer();
  const port = await mockServer.start();
  process.env["BITGET_API_BASE_URL"] = `http://localhost:${port}`;
  process.env["BITGET_API_KEY"] = "test-key";
  process.env["BITGET_SECRET_KEY"] = "test-secret";
  process.env["BITGET_PASSPHRASE"] = "test-passphrase";

  const config = loadConfig({ modules: "spot,account", readOnly: false });
  const server = createServer(config);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  mcpClient = new Client({ name: "test-client", version: "1.0" }, { capabilities: {} });
  await mcpClient.connect(clientTransport);
});

beforeEach(() => mockServer.reset());

afterAll(async () => {
  await mcpClient.close();
  await mockServer.stop();
});

test("list_tools includes spot_get_ticker and system_get_capabilities", async () => {
  const result = await mcpClient.listTools();
  const names = result.tools.map((t) => t.name);
  expect(names).toContain("spot_get_ticker");
  expect(names).toContain("system_get_capabilities");
});

test("call spot_get_ticker returns ok:true", async () => {
  const result = await mcpClient.callTool({ name: "spot_get_ticker", arguments: { symbol: "BTCUSDT" } });
  expect(result.isError).toBeFalsy();
  const content = result.content as Array<{ text: string }>;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const text = content[0]!.text;
  const parsed = JSON.parse(text) as Record<string, unknown>;
  expect(parsed["ok"]).toBe(true);
  expect(parsed["tool"]).toBe("spot_get_ticker");
});

test("call unknown tool returns isError:true", async () => {
  const result = await mcpClient.callTool({ name: "nonexistent_tool", arguments: {} });
  expect(result.isError).toBe(true);
  const content = result.content as Array<{ text: string }>;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const text = content[0]!.text;
  const parsed = JSON.parse(text) as Record<string, unknown>;
  expect(parsed["ok"]).toBe(false);
});

test("system_get_capabilities returns capabilities snapshot", async () => {
  const result = await mcpClient.callTool({ name: "system_get_capabilities", arguments: {} });
  expect(result.isError).toBeFalsy();
  const content = result.content as Array<{ text: string }>;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const text = content[0]!.text;
  const parsed = JSON.parse(text) as Record<string, unknown>;
  expect(parsed["ok"]).toBe(true);
  const data = parsed["data"] as Record<string, unknown>;
  expect(data["capabilities"]).toBeDefined();
});

test("error injection returns isError:true with error code", async () => {
  mockServer.setState({
    errorOverrides: new Map([["GET /api/v2/spot/market/tickers", { code: "40001", msg: "Rate limit exceeded" }]]),
  });
  const result = await mcpClient.callTool({ name: "spot_get_ticker", arguments: { symbol: "BTCUSDT" } });
  expect(result.isError).toBe(true);
});
