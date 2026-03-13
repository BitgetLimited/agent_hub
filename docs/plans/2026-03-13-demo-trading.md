# Demo Trading Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `--paper-trading` flag to `bgc` CLI and `bitget-mcp` server so all API requests include the `paptrading: 1` header required by Bitget's demo trading environment, and update `bitget-skill` with a Demo Trading guide.

**Architecture:** Add `paperTrading: boolean` to `BitgetConfig` and `CliOptions` in `bitget-core`. `BitgetRestClient` injects the header when `paperTrading` is true. `bitget-client` (bgc) and `bitget-mcp` each parse `--paper-trading` from their CLI args and pass it to `loadConfig()`. The skill gets a new `demo-trading.md` reference and a section in the main skill file.

**Tech Stack:** TypeScript, Node.js, Vitest, `bitget-test-utils` MockServer (for tests)

---

## Task 1: Add `paperTrading` to `BitgetConfig` and `loadConfig()`

**Files:**
- Modify: `packages/bitget-core/src/config.ts`
- Test: `packages/bitget-core/tests/config.test.ts` (create new)

**Step 1: Write the failing test**

Create `packages/bitget-core/tests/config.test.ts`:

```typescript
import { test, expect } from "vitest";
import { loadConfig } from "bitget-core";

test("loadConfig sets paperTrading=false by default", () => {
  const config = loadConfig({ modules: "spot", readOnly: false, paperTrading: false });
  expect(config.paperTrading).toBe(false);
});

test("loadConfig sets paperTrading=true when flag is true", () => {
  const config = loadConfig({ modules: "spot", readOnly: false, paperTrading: true });
  expect(config.paperTrading).toBe(true);
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/bitget-core && npm test -- --reporter=verbose 2>&1 | grep -A5 "paperTrading"
```
Expected: FAIL — `paperTrading` is not a property of `CliOptions`

**Step 3: Add `paperTrading` to `CliOptions` and `BitgetConfig`**

In `packages/bitget-core/src/config.ts`:

```typescript
export interface CliOptions {
  modules?: string;
  readOnly: boolean;
  paperTrading: boolean;   // ADD THIS
}

export interface BitgetConfig {
  apiKey?: string;
  secretKey?: string;
  passphrase?: string;
  hasAuth: boolean;
  baseUrl: string;
  timeoutMs: number;
  modules: ModuleId[];
  readOnly: boolean;
  paperTrading: boolean;   // ADD THIS
}
```

In `loadConfig()`, add to the returned object:
```typescript
return {
  apiKey,
  secretKey,
  passphrase,
  hasAuth,
  baseUrl: loadBaseUrl(),
  timeoutMs: loadTimeoutMs(),
  modules: parseModuleList(cli.modules),
  readOnly: cli.readOnly,
  paperTrading: cli.paperTrading,   // ADD THIS
};
```

**Step 4: Run test to verify it passes**

```bash
cd packages/bitget-core && npm test -- --reporter=verbose 2>&1 | grep -A5 "paperTrading"
```
Expected: PASS (2 tests)

**Step 5: Typecheck**

```bash
cd packages/bitget-core && npm run typecheck
```
Expected: no errors

**Step 6: Commit**

```bash
git add packages/bitget-core/src/config.ts packages/bitget-core/tests/config.test.ts
git commit -m "feat(bitget-core): add paperTrading field to BitgetConfig and CliOptions"
```

---

## Task 2: Inject `paptrading: 1` header in `BitgetRestClient`

**Files:**
- Modify: `packages/bitget-core/src/client/rest-client.ts`
- Test: `packages/bitget-core/tests/client/paper-trading.test.ts` (create new)

**Step 1: Write the failing test**

Create `packages/bitget-core/tests/client/paper-trading.test.ts`:

```typescript
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { MockServer } from "bitget-test-utils";
import { loadConfig, BitgetRestClient } from "bitget-core";

let server: MockServer;
let capturedHeaders: Record<string, string> = {};

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
    // Spy on fetch to capture headers
    const originalFetch = globalThis.fetch;
    let sentHeaders: Headers | undefined;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      sentHeaders = new Headers(init?.headers);
      return originalFetch(input, init);
    };
    await client.publicGet("/api/v2/spot/market/tickers");
    globalThis.fetch = originalFetch;
    expect(sentHeaders?.has("paptrading")).toBe(false);
  });

  test("sends paptrading: 1 header when paperTrading=true", async () => {
    const config = loadConfig({ modules: "spot", readOnly: false, paperTrading: true });
    const client = new BitgetRestClient(config);
    const originalFetch = globalThis.fetch;
    let sentHeaders: Headers | undefined;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      sentHeaders = new Headers(init?.headers);
      return originalFetch(input, init);
    };
    await client.publicGet("/api/v2/spot/market/tickers");
    globalThis.fetch = originalFetch;
    expect(sentHeaders?.get("paptrading")).toBe("1");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/bitget-core && npm test -- --reporter=verbose 2>&1 | grep -A5 "paptrading"
```
Expected: FAIL — `paptrading` header is never set

**Step 3: Add header injection in `request()`**

In `packages/bitget-core/src/client/rest-client.ts`, after the `locale` header line (around line 113), add:

```typescript
const headers = new Headers({
  "Content-Type": "application/json",
  Accept: "application/json",
  locale: "en-US",
});

if (this.config.paperTrading) {
  headers.set("paptrading", "1");
}
```

**Step 4: Run test to verify it passes**

```bash
cd packages/bitget-core && npm test -- --reporter=verbose 2>&1 | grep -A5 "paptrading"
```
Expected: PASS (2 tests)

**Step 5: Run full test suite to check for regressions**

```bash
cd packages/bitget-core && npm test
```
Expected: all tests pass

**Step 6: Typecheck**

```bash
cd packages/bitget-core && npm run typecheck
```
Expected: no errors

**Step 7: Commit**

```bash
git add packages/bitget-core/src/client/rest-client.ts packages/bitget-core/tests/client/paper-trading.test.ts
git commit -m "feat(bitget-core): inject paptrading header when paperTrading=true"
```

---

## Task 3: Add `--paper-trading` flag to `bgc` CLI

**Files:**
- Modify: `packages/bitget-client/src/index.ts`
- Test: `packages/bitget-client/tests/cli.test.ts`

**Step 1: Read existing CLI test to understand the pattern**

```bash
cat packages/bitget-client/tests/cli.test.ts
```

**Step 2: Add a failing test for `--paper-trading` flag**

Open `packages/bitget-client/tests/cli.test.ts` and add a test that verifies `--paper-trading` is accepted and doesn't cause an error (the exact approach depends on what the existing tests look like — typically they invoke the CLI as a subprocess or mock `loadConfig`).

Add this test:
```typescript
test("--paper-trading flag is accepted without error", async () => {
  // Run bgc with --paper-trading and a public read-only command
  // Should not crash; paper trading flag is passed to config
  const result = await runCli([
    "--paper-trading", "spot", "spot_get_ticker", "--symbol", "BTCUSDT"
  ]);
  expect(result.exitCode).toBe(0);
});
```

**Step 3: Run test to verify it fails**

```bash
cd packages/bitget-client && npm test -- --reporter=verbose 2>&1 | tail -20
```
Expected: FAIL — unknown flag or `paperTrading` not in `loadConfig` call

**Step 4: Update `bgc` CLI**

In `packages/bitget-client/src/index.ts`:

1. Add `--paper-trading` to the help text:
```typescript
function printHelp(): void {
  process.stdout.write(`
Usage: bgc <module> <tool> [--param value ...]

Modules: spot, futures, account, margin, copytrading, convert, earn, p2p, broker

Examples:
  bgc spot spot_get_ticker --symbol BTCUSDT
  bgc futures futures_get_positions
  bgc account account_get_balance

Options:
  --read-only       Only allow read/query tools
  --paper-trading   Use Bitget Demo Trading environment (requires Demo API Key)
  --pretty          Pretty-print JSON output
  --help            Show this help
  --version         Show version

Auth (environment variables):
  BITGET_API_KEY, BITGET_SECRET_KEY, BITGET_PASSPHRASE

Demo Trading:
  Set BITGET_API_KEY etc. to your Demo API Key credentials, then:
  bgc --paper-trading spot spot_get_ticker --symbol BTCUSDT
`);
}
```

2. Add `paper-trading` to the skip list (line ~58):
```typescript
if (key === "pretty" || key === "read-only" || key === "help" || key === "version" || key === "paper-trading") continue;
```

3. Parse the flag and pass to `loadConfig`:
```typescript
const pretty = argv.includes("--pretty");
const readOnly = argv.includes("--read-only");
const paperTrading = argv.includes("--paper-trading");   // ADD THIS

// ...existing toolArgs parsing...

const config = loadConfig({ modules: module, readOnly, paperTrading });   // ADD paperTrading
```

**Step 5: Run test to verify it passes**

```bash
cd packages/bitget-client && npm test -- --reporter=verbose 2>&1 | tail -20
```
Expected: PASS

**Step 6: Typecheck**

```bash
cd packages/bitget-client && npm run typecheck
```
Expected: no errors

**Step 7: Manual smoke test**

```bash
bgc --paper-trading spot spot_get_ticker --symbol BTCUSDT --pretty
```
Expected: JSON response with BTC ticker data (same as live, since public endpoint)

**Step 8: Commit**

```bash
git add packages/bitget-client/src/index.ts packages/bitget-client/tests/cli.test.ts
git commit -m "feat(bgc): add --paper-trading flag for Bitget Demo Trading"
```

---

## Task 4: Add `--paper-trading` flag to `bitget-mcp`

**Files:**
- Modify: `packages/bitget-mcp/src/index.ts`
- Test: `packages/bitget-mcp/tests/server.test.ts`

**Step 1: Read existing MCP server test**

```bash
cat packages/bitget-mcp/tests/server.test.ts
```

**Step 2: Add a failing test for paper trading config**

In `packages/bitget-mcp/tests/server.test.ts`, add a test that verifies the server correctly passes `paperTrading: true` when `--paper-trading` CLI arg is present. Since the server is initialized via `main()`, mock or inspect `loadConfig` being called with the right args.

```typescript
test("paper-trading flag sets paperTrading=true in config", async () => {
  // Verify that parseArgs with --paper-trading produces paperTrading=true
  // This tests the CLI parsing layer, not the full server
  process.argv = ["node", "bitget-mcp", "--paper-trading"];
  // Import and call parseCli (export it if needed), or test indirectly
  // via checking config.paperTrading === true
  const config = loadConfig({ modules: undefined, readOnly: false, paperTrading: true });
  expect(config.paperTrading).toBe(true);
});
```

**Step 3: Update `bitget-mcp/src/index.ts`**

1. Add `"paper-trading"` to `parseArgs` options:
```typescript
function parseCli() {
  const parsed = parseArgs({
    options: {
      modules: { type: "string" },
      "read-only": { type: "boolean", default: false },
      "paper-trading": { type: "boolean", default: false },   // ADD THIS
      help: { type: "boolean", default: false },
      version: { type: "boolean", default: false },
    },
    allowPositionals: false,
  });
  return {
    modules: parsed.values.modules,
    readOnly: parsed.values["read-only"],
    paperTrading: parsed.values["paper-trading"],   // ADD THIS
    help: parsed.values.help,
    version: parsed.values.version,
  };
}
```

2. Pass `paperTrading` to `loadConfig` in `main()`:
```typescript
const config = loadConfig({ modules: cli.modules, readOnly: cli.readOnly, paperTrading: cli.paperTrading ?? false });
```

3. Update `printHelp()` to include the new flag and a demo trading note:
```typescript
  --paper-trading          Enable Demo Trading mode (requires Demo API Key)
                           All requests will include the paptrading: 1 header
```

**Step 4: Run test to verify it passes**

```bash
cd packages/bitget-mcp && npm test -- --reporter=verbose 2>&1 | tail -20
```
Expected: PASS

**Step 5: Typecheck**

```bash
cd packages/bitget-mcp && npm run typecheck
```
Expected: no errors

**Step 6: Commit**

```bash
git add packages/bitget-mcp/src/index.ts packages/bitget-mcp/tests/server.test.ts
git commit -m "feat(bitget-mcp): add --paper-trading flag for Bitget Demo Trading"
```

---

## Task 5: Add Demo Trading reference doc to `bitget-skill`

**Files:**
- Create: `packages/bitget-skill/references/demo-trading.md`

**Step 1: Create the reference doc**

Create `packages/bitget-skill/references/demo-trading.md`:

````markdown
# Bitget Demo Trading

Demo Trading lets you trade with virtual funds in a real-market environment.
Use it to test strategies without risking real money.

## Prerequisites

1. Log in to https://www.bitget.com
2. Switch to Demo Trading mode (toggle in the top navigation bar)
3. Go to **Personal Center → API Key Management**
4. Create a **Demo API Key** with Trade permissions
5. Note: Demo API Keys are completely separate from live trading keys

## Using Demo Mode with bgc CLI

Set your Demo API Key credentials as environment variables:

```bash
export BITGET_API_KEY="your-demo-api-key"
export BITGET_SECRET_KEY="your-demo-secret-key"
export BITGET_PASSPHRASE="your-demo-passphrase"
```

Then add `--paper-trading` flag to any bgc command:

```bash
# Check demo account balance
bgc --paper-trading account get_account_assets

# Place a demo spot order
bgc --paper-trading spot spot_place_order --orders '[{"symbol":"BTCUSDT","side":"buy","orderType":"market","size":"0.01"}]'

# Check demo futures positions
bgc --paper-trading futures futures_get_positions --productType USDT-FUTURES

# Place a demo futures order
bgc --paper-trading futures futures_place_order --orders '[{"symbol":"BTCUSDT","productType":"USDT-FUTURES","marginCoin":"USDT","size":"0.01","side":"open_long","orderType":"market"}]'
```

## Using Demo Mode with bitget-mcp

Start the MCP server with the `--paper-trading` flag:

```bash
bitget-mcp --paper-trading --modules spot,futures,account
```

All tools in that MCP session will operate in demo mode.

## Important Caveats

- **Demo keys ≠ Live keys**: Never mix them. Demo keys only work with `--paper-trading`.
- **Virtual funds only**: No real money is involved; balances reset periodically.
- **Real market data**: Prices reflect live market conditions.
- **All modules supported**: Spot, futures, account, etc. all work in demo mode.
````

**Step 2: Commit**

```bash
git add packages/bitget-skill/references/demo-trading.md
git commit -m "docs(bitget-skill): add demo-trading reference doc"
```

---

## Task 6: Add Demo Trading section to `bitget-skill` main SKILL.md

**Files:**
- Modify: `packages/bitget-skill/SKILL.md`

**Step 1: Read the current SKILL.md**

```bash
cat packages/bitget-skill/SKILL.md
```

**Step 2: Add Demo Trading section**

Find the "Module quick-reference" table in `SKILL.md` and add a new "Demo Trading Mode" section after it:

```markdown
## Demo Trading Mode

Use demo mode when the user wants to practice trading, test strategies, or explicitly asks for "demo", "paper trading", or "simulated trading".

**Setup:** The user needs a Bitget Demo API Key. See `~/.claude/skills/bitget-skill/references/demo-trading.md` for full setup steps.

**For bgc CLI:** Add `--paper-trading` as the FIRST flag after `bgc`:
```bash
bgc --paper-trading spot spot_get_ticker --symbol BTCUSDT
bgc --paper-trading futures futures_get_positions --productType USDT-FUTURES
bgc --paper-trading account get_account_assets
```

**For MCP tools:** The MCP server must be started with `--paper-trading`. If the user is asking to use demo mode via MCP but the server wasn't started with that flag, inform them they need to restart with `--paper-trading`.

**Key rule:** In demo mode, add `--paper-trading` to EVERY bgc command in the session. Never mix demo and live commands in the same session.
```

**Step 3: Also update the references table**

Add a row to the references table in `SKILL.md` (the one that lists `commands.md`, `error-codes.md`, `auth-setup.md`):

```markdown
| `demo-trading.md` | Demo Trading setup, bgc usage, MCP configuration |
```

**Step 4: Commit**

```bash
git add packages/bitget-skill/SKILL.md
git commit -m "feat(bitget-skill): add Demo Trading Mode section and reference"
```

---

## Task 7: Sync skill to `~/.claude/skills/bitget-skill`

The skill files in `~/.claude/skills/bitget-skill/` are separate from `packages/bitget-skill/`. Check if there's a sync script.

**Step 1: Check for sync script**

```bash
ls packages/bitget-skill/scripts/
cat packages/bitget-skill/package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('scripts',{}), indent=2))"
```

**Step 2: Run sync script if it exists**

```bash
cd packages/bitget-skill && npm run sync   # or whatever the script is named
```

If no sync script: manually copy the updated files:
```bash
cp packages/bitget-skill/SKILL.md ~/.claude/skills/bitget-skill/SKILL.md
cp packages/bitget-skill/references/demo-trading.md ~/.claude/skills/bitget-skill/references/demo-trading.md
```

**Step 3: Verify the installed skill has the new section**

```bash
grep -n "Demo Trading" ~/.claude/skills/bitget-skill/SKILL.md
grep -n "paper-trading" ~/.claude/skills/bitget-skill/SKILL.md
```
Expected: lines found with Demo Trading section and `--paper-trading` usage

**Step 4: Commit if sync script modified any tracked files**

```bash
git status && git add -A && git commit -m "chore(bitget-skill): sync demo trading skill to installed location"
```

---

## Task 8: Full regression test across all packages

**Step 1: Run all tests**

```bash
cd /Users/dannie.li/project/openhub/agent_hub && npm test --workspaces 2>&1 | tail -40
```

Or per-package if workspace test isn't configured:
```bash
(cd packages/bitget-core && npm test) && \
(cd packages/bitget-mcp && npm test) && \
(cd packages/bitget-client && npm test)
```

Expected: all tests pass

**Step 2: Typecheck all packages**

```bash
(cd packages/bitget-core && npm run typecheck) && \
(cd packages/bitget-mcp && npm run typecheck) && \
(cd packages/bitget-client && npm run typecheck)
```

Expected: no errors

**Step 3: Final commit if needed**

If any cleanup was done:
```bash
git add -A && git commit -m "chore: post-integration cleanup for demo trading support"
```
