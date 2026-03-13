import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { MockServer } from "bitget-test-utils";
import { loadConfig, BitgetRestClient } from "bitget-core";

let server: MockServer;

beforeAll(async () => {
  server = new MockServer();
  const port = await server.start();
  process.env["BITGET_API_BASE_URL"] = `http://localhost:${port}`;
  process.env["BITGET_API_KEY"] = "test-key";
  process.env["BITGET_SECRET_KEY"] = "test-secret";
  process.env["BITGET_PASSPHRASE"] = "test-passphrase";
});

afterAll(() => server.stop());

describe("paper trading header", () => {
  test("does NOT send paptrading header when paperTrading=false", async () => {
    const config = loadConfig({ modules: "spot", readOnly: false, paperTrading: false });
    const client = new BitgetRestClient(config);
    const originalFetch = globalThis.fetch;
    let sentHeaders: Headers | undefined;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      sentHeaders = new Headers(init?.headers as HeadersInit);
      return originalFetch(input, init);
    };
    try {
      await client.publicGet("/api/v2/spot/market/tickers");
    } finally {
      globalThis.fetch = originalFetch;
    }
    expect(sentHeaders?.has("paptrading")).toBe(false);
  });

  test("sends paptrading: 1 header when paperTrading=true", async () => {
    const config = loadConfig({ modules: "spot", readOnly: false, paperTrading: true });
    const client = new BitgetRestClient(config);
    const originalFetch = globalThis.fetch;
    let sentHeaders: Headers | undefined;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      sentHeaders = new Headers(init?.headers as HeadersInit);
      return originalFetch(input, init);
    };
    try {
      await client.publicGet("/api/v2/spot/market/tickers");
    } finally {
      globalThis.fetch = originalFetch;
    }
    expect(sentHeaders?.get("paptrading")).toBe("1");
  });
});
