# Architecture Fixes Design

**Date:** 2026-03-03
**Branch:** feature/skills
**Scope:** 6 targeted code quality and architecture fixes — no new features, no restructuring.

---

## Goals

Remove unnecessary coupling, fix a runtime inefficiency, align error format with documentation, and ensure `bitget-skill` is publishable standalone.

---

## Fix 1 — Remove MCP SDK from `bitget-core`

**Problem:** `tools/types.ts` imports `Tool["inputSchema"]` from `@modelcontextprotocol/sdk` solely to type `JsonSchema`. This adds the full MCP SDK as a transitive dependency of `bitget-core`, which every consumer (including the lightweight `bgc` CLI) inherits unnecessarily.

**Solution:** Define a self-contained `JsonSchema` type inline in `bitget-core`. Remove `@modelcontextprotocol/sdk` from `bitget-core/package.json`. `bitget-mcp` already has the SDK as a direct dependency and handles its own MCP typing.

**Files:**
- `packages/bitget-core/src/tools/types.ts` — replace imported type with inline definition
- `packages/bitget-core/package.json` — remove `@modelcontextprotocol/sdk` dependency

---

## Fix 2 — Cache capability snapshot in MCP server

**Problem:** `buildCapabilitySnapshot(config)` is called on every `CallTool` request in `server.ts`. Since `config` is immutable after server startup, this rebuilds the full module availability map on every tool invocation.

**Solution:** Compute the snapshot once inside `createServer()` after building tools, store it in a `const`, and reuse it at all call sites (lines 217, 225, 227).

Note: `listVisibleTools()` still runs dynamically because earn capability state can change after warmup.

**Files:**
- `packages/bitget-mcp/src/server.ts` — compute snapshot once, replace 3 call sites

---

## Fix 3 — Deduplicate `readString` double-call in `spot_place_plan_order`

**Problem:** `spot-trade.ts` calls `readString(args, "triggerType")` twice in a ternary expression on lines 312-315.

**Solution:** Read into a local variable first, then branch on it.

```ts
const rawTriggerType = readString(args, "triggerType") ?? "fill_price";
triggerType: rawTriggerType === "last_price" ? "fill_price" : rawTriggerType,
```

**Files:**
- `packages/bitget-core/src/tools/spot-trade.ts`

---

## Fix 4 — Move `toMcpTool` out of `bitget-core`

**Problem:** `toMcpTool()` converts a `ToolSpec` to MCP's `Tool` format. This is MCP-specific logic that doesn't belong in the shared core library. Non-MCP consumers carry dead code.

**Solution:** Remove `toMcpTool()` from `bitget-core/src/tools/types.ts` and its re-export from `bitget-core/src/index.ts`. Add it inline in `bitget-mcp/src/server.ts` (it's a small pure function).

**Files:**
- `packages/bitget-core/src/tools/types.ts` — remove `toMcpTool`
- `packages/bitget-core/src/index.ts` — remove `toMcpTool` export
- `packages/bitget-mcp/src/server.ts` — add local `toMcpTool` function

---

## Fix 5 — Align error payload format with documentation

**Problem:** `toToolErrorPayload` returns a flat shape `{ error: true, type, code, message, ... }` but `docs/error-codes.md` documents the nested shape `{ ok: false, error: { type, code, message, suggestion } }`. This inconsistency will confuse API consumers.

**Solution:** Update `ToolErrorPayload` in `errors.ts` to the nested documented shape:

```ts
interface ToolErrorPayload {
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
```

Update all call sites to access `payload.error.message` etc. The MCP server's `errorResult` function spreads the payload — update that spread accordingly. `docs/error-codes.md` already shows the correct shape, so no doc changes needed.

**Files:**
- `packages/bitget-core/src/utils/errors.ts` — update `ToolErrorPayload` type and `toToolErrorPayload` return value
- `packages/bitget-client/src/index.ts` — update error output (currently uses flat shape)
- `packages/bitget-mcp/src/server.ts` — update `errorResult` spread

---

## Fix 6 — Pre-generate `commands.md` for `bitget-skill` npm publish

**Problem:** `gen-references.js` imports `bitget-core` at runtime. `bitget-core` is only a `devDependency` of `bitget-skill`, meaning it's absent when an end user installs `bitget-skill` from npm. The install would succeed but `commands.md` could be stale or missing.

**Solution:** Add `prepublishOnly` to run `gen-references.js` before every `npm publish`, ensuring the file is always fresh in the tarball. The `postinstall` script only copies already-present files and never needs `bitget-core` at install time.

```json
"scripts": {
  "gen-references": "node scripts/gen-references.js",
  "prepublishOnly": "node scripts/gen-references.js",
  "postinstall": "node scripts/install.js"
}
```

**Files:**
- `packages/bitget-skill/package.json` — add `prepublishOnly` script

---

## Non-goals

- No new features
- No test suite (deferred to a future iteration)
- No changes to `bitget-core`'s module structure beyond the two type changes above
- No version bumps
