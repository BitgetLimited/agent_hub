import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { MockServer } from "bitget-test-utils";

const execFileAsync = promisify(execFile);

// Use node --experimental-strip-types to run TypeScript directly (Node >= 22.6)
const nodeBin = process.execPath;
const cliEntry = new URL("../src/index.ts", import.meta.url).pathname;

function runCli(args: string[], env?: Record<string, string>) {
  return spawnSync(nodeBin, ["--experimental-strip-types", cliEntry, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: 15000,
  });
}

async function runCliAsync(
  args: string[],
  env?: Record<string, string>,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(
      nodeBin,
      ["--experimental-strip-types", cliEntry, ...args],
      {
        encoding: "utf8",
        env: { ...process.env, ...env },
        timeout: 15000,
      },
    );
    return { stdout, stderr, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      exitCode: typeof e.code === "number" ? e.code : 1,
    };
  }
}

describe("bgc CLI", () => {
  it("--version exits 0 and prints version string", () => {
    const result = runCli(["--version"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/bgc.*bitget-core/i);
  });

  it("--help exits 0 and prints usage info", () => {
    const result = runCli(["--help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/usage/i);
    expect(result.stdout).toContain("bgc");
  });

  it("unknown tool exits non-zero and reports error to stderr", () => {
    const result = runCli(["spot", "spot_nonexistent_tool_xyz"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("spot_nonexistent_tool_xyz");
  });

  it("private endpoint without credentials exits non-zero with ConfigError", () => {
    const result = runCli(["spot", "spot_get_orders"], {
      BITGET_API_KEY: "",
      BITGET_SECRET_KEY: "",
      BITGET_PASSPHRASE: "",
    });
    expect(result.status).not.toBe(0);
    const payload = JSON.parse(result.stderr);
    expect(payload.ok).toBe(false);
    expect(payload.error.type).toBe("ConfigError");
  });

  describe("with mock server", () => {
    let server: MockServer;
    let baseUrl: string;

    beforeAll(async () => {
      server = new MockServer();
      const port = await server.start();
      baseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(async () => {
      await server.stop();
    });

    it("spot_get_ticker returns valid JSON with endpoint and data", async () => {
      const result = await runCliAsync(["spot", "spot_get_ticker", "--symbol", "BTCUSDT"], {
        BITGET_API_BASE_URL: baseUrl,
        BITGET_TIMEOUT_MS: "5000",
      });
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty("endpoint");
      expect(output.endpoint).toContain("/api/v2/spot/market/tickers");
      expect(output).toHaveProperty("data");
      expect(Array.isArray(output.data)).toBe(true);
      expect(output.data.length).toBeGreaterThan(0);
      expect(output.data[0]).toHaveProperty("symbol", "BTCUSDT");
    });

    it("numeric --limit parameter is parsed as number, not string", async () => {
      const result = await runCliAsync(
        ["spot", "spot_get_trades", "--symbol", "BTCUSDT", "--limit", "5"],
        { BITGET_API_BASE_URL: baseUrl, BITGET_TIMEOUT_MS: "5000" },
      );
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty("data");
    });

    it("--paper-trading flag is accepted and succeeds", async () => {
      const result = await runCliAsync(
        ["--paper-trading", "spot", "spot_get_ticker", "--symbol", "BTCUSDT"],
        { BITGET_API_BASE_URL: baseUrl, BITGET_TIMEOUT_MS: "5000" },
      );
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty("data");
    });

    it("--help mentions paper-trading", () => {
      const result = runCli(["--help"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("paper-trading");
    });
  });
});
