# Architecture Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply 6 targeted architecture and code quality fixes to the bitget monorepo.

**Architecture:** All fixes are independent and touch different files. Each can be implemented, typechecked, and committed in isolation. No new dependencies. No structural changes.

**Tech Stack:** TypeScript, pnpm workspaces, tsup, Node.js 18+

---

### Task 1: Remove MCP SDK from bitget-core

**Files:**
- Modify: `packages/bitget-core/src/tools/types.ts`
- Modify: `packages/bitget-core/package.json`

**Step 1: Replace the imported JsonSchema type**

In `packages/bitget-core/src/tools/types.ts`, replace:
```ts
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
// ...
export type JsonSchema = Tool["inputSchema"];
```
with:
```ts
export type JsonSchema = {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean | Record<string, unknown>;
  [key: string]: unknown;
};
```

**Step 2: Remove the SDK dependency**

In `packages/bitget-core/package.json`, remove the line:
```json
"@modelcontextprotocol/sdk": "^1.0.0",
```
from `dependencies`.

**Step 3: Typecheck**

```bash
cd packages/bitget-core && pnpm typecheck
cd packages/bitget-mcp && pnpm typecheck
cd packages/bitget-client && pnpm typecheck
```
Expected: no errors in any package.

**Step 4: Commit**

```bash
git -c commit.gpgsign=false commit -am "refactor: remove MCP SDK dep from bitget-core, inline JsonSchema type"
```

---

### Task 2: Cache capability snapshot in MCP server

**Files:**
- Modify: `packages/bitget-mcp/src/server.ts`

**Step 1: Compute snapshot once**

In `createServer()`, after `const toolMap = ...`, add:
```ts
const capabilitySnapshot = buildCapabilitySnapshot(config);
```

**Step 2: Replace all 3 dynamic call sites**

Replace every occurrence of `buildCapabilitySnapshot(config)` in the handler bodies with the cached `capabilitySnapshot` variable. There are 3 occurrences:
- `unknownToolResult(toolName, buildCapabilitySnapshot(config))` (line ~217)
- `successResult(toolName, response, buildCapabilitySnapshot(config))` (line ~225)
- `errorResult(toolName, error, buildCapabilitySnapshot(config))` (line ~227)

**Step 3: Typecheck**

```bash
cd packages/bitget-mcp && pnpm typecheck
```
Expected: no errors.

**Step 4: Commit**

```bash
git -c commit.gpgsign=false commit -am "perf: cache capability snapshot at server startup instead of per-request"
```

---

### Task 3: Deduplicate readString call in spot_place_plan_order

**Files:**
- Modify: `packages/bitget-core/src/tools/spot-trade.ts`

**Step 1: Extract local variable**

In the `spot_place_plan_order` handler, find:
```ts
triggerType:
  readString(args, "triggerType") === "last_price"
    ? "fill_price"
    : (readString(args, "triggerType") ?? "fill_price"),
```

Replace with (add the variable before the `compactObject` call):
```ts
const rawTriggerType = readString(args, "triggerType") ?? "fill_price";
```

And in the `compactObject`:
```ts
triggerType: rawTriggerType === "last_price" ? "fill_price" : rawTriggerType,
```

**Step 2: Typecheck**

```bash
cd packages/bitget-core && pnpm typecheck
```
Expected: no errors.

**Step 3: Commit**

```bash
git -c commit.gpgsign=false commit -am "fix: read triggerType once in spot_place_plan_order handler"
```

---

### Task 4: Move toMcpTool out of bitget-core into bitget-mcp

**Files:**
- Modify: `packages/bitget-core/src/tools/types.ts`
- Modify: `packages/bitget-core/src/index.ts`
- Modify: `packages/bitget-mcp/src/server.ts`

**Step 1: Remove toMcpTool from bitget-core**

In `packages/bitget-core/src/tools/types.ts`, delete the entire `toMcpTool` function (lines 24-36).

In `packages/bitget-core/src/index.ts`, remove `toMcpTool` from the export line:
```ts
export { toMcpTool } from "./tools/types.js";
```
Delete this line entirely.

**Step 2: Add toMcpTool in bitget-mcp**

In `packages/bitget-mcp/src/server.ts`, add a local function after the imports:
```ts
import type { ToolSpec } from "bitget-core";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

function toMcpTool(tool: ToolSpec): Tool {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema as Tool["inputSchema"],
    annotations: {
      readOnlyHint: !tool.isWrite,
      destructiveHint: tool.isWrite,
      idempotentHint: !tool.isWrite,
      openWorldHint: true,
    },
  };
}
```

Remove the `toMcpTool` import from `bitget-core` in `server.ts`.

**Step 3: Typecheck all packages**

```bash
cd packages/bitget-core && pnpm typecheck
cd packages/bitget-mcp && pnpm typecheck
```
Expected: no errors.

**Step 4: Commit**

```bash
git -c commit.gpgsign=false commit -am "refactor: move toMcpTool from bitget-core into bitget-mcp"
```

---

### Task 5: Align error payload format with documentation

**Files:**
- Modify: `packages/bitget-core/src/utils/errors.ts`
- Modify: `packages/bitget-client/src/index.ts`
- Modify: `packages/bitget-mcp/src/server.ts`

**Step 1: Update ToolErrorPayload type and toToolErrorPayload**

In `packages/bitget-core/src/utils/errors.ts`, replace `ToolErrorPayload` interface and `toToolErrorPayload` function:

```ts
export interface ToolErrorPayload {
  ok: false;
  error: {
    type: ErrorType;
    code?: string;
    message: string;
    suggestion?: string;
    endpoint?: string;
  };
  timestamp: string;
}

export function toToolErrorPayload(
  error: unknown,
  fallbackEndpoint?: string,
): ToolErrorPayload {
  if (error instanceof BitgetMcpError) {
    return {
      ok: false,
      error: {
        type: error.type,
        code: error.code,
        message: error.message,
        suggestion: error.suggestion,
        endpoint: error.endpoint ?? fallbackEndpoint,
      },
      timestamp: new Date().toISOString(),
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    ok: false,
    error: {
      type: "InternalError",
      message,
      suggestion:
        "Unexpected server error. Check tool arguments and retry. If it persists, inspect server logs.",
      endpoint: fallbackEndpoint,
    },
    timestamp: new Date().toISOString(),
  };
}
```

**Step 2: Update bitget-client error output**

In `packages/bitget-client/src/index.ts`, the catch block writes `JSON.stringify(payload, null, 2)`. The payload shape changed — no code change needed since we still serialize the whole object. Verify it still compiles.

**Step 3: Update bitget-mcp errorResult**

In `packages/bitget-mcp/src/server.ts`, `errorResult` currently spreads the payload flat:
```ts
const structured: Record<string, unknown> = {
  tool: toolName,
  ...payload,
  capabilities: capabilitySnapshot,
};
```

Update to nest correctly:
```ts
const structured: Record<string, unknown> = {
  tool: toolName,
  ok: false,
  error: payload.error,
  timestamp: payload.timestamp,
  capabilities: capabilitySnapshot,
};
```

**Step 4: Typecheck all packages**

```bash
cd packages/bitget-core && pnpm typecheck
cd packages/bitget-client && pnpm typecheck
cd packages/bitget-mcp && pnpm typecheck
```
Expected: no errors.

**Step 5: Commit**

```bash
git -c commit.gpgsign=false commit -am "fix: align ToolErrorPayload to documented nested {ok,error} format"
```

---

### Task 6: Add prepublishOnly to bitget-skill

**Files:**
- Modify: `packages/bitget-skill/package.json`

**Step 1: Add prepublishOnly script**

In `packages/bitget-skill/package.json`, update scripts to:
```json
"scripts": {
  "gen-references": "node scripts/gen-references.js",
  "prepublishOnly": "node scripts/gen-references.js",
  "postinstall": "node scripts/install.js"
}
```

**Step 2: Verify gen-references still works in monorepo**

```bash
cd packages/bitget-skill && node scripts/gen-references.js
```
Expected: `references/commands.md` updated with current tool count (58 tools).

**Step 3: Commit**

```bash
git -c commit.gpgsign=false commit -am "fix: add prepublishOnly to regenerate commands.md before npm publish"
```
