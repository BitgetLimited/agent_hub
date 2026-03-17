# Bitget Classic V2 API Audit & Fix — Design Spec

**Date:** 2026-03-17
**Scope:** Classic V2 API (`/api/v2/...`) — all currently implemented modules
**Out of scope:** UTA V3 API (`/api/v3/...`), `instloan`, `tax`, `affiliate`, `demotrading` (not implemented in bitget-core)

---

## Problem Statement

The `bitget-core` package implements Bitget Classic V2 API tools. The `docs/API文档/docs_EN/classic/` directory contains the authoritative API reference. The implementation may have:
- Wrong endpoint paths
- Missing or incorrectly named parameters
- Incorrect routing logic (wrong endpoint selected based on args)
- Missing endpoints that should be mapped
- Incorrect HTTP methods (GET vs POST)

The goal is to audit every implemented module against the official docs and fix all discrepancies.

---

## Modules in Scope

| Module | Doc Directory | Implementation File |
|--------|--------------|---------------------|
| spot market | `classic/spot/market/` | `packages/bitget-core/src/tools/spot-market.ts` |
| spot trade | `classic/spot/trade/` | `packages/bitget-core/src/tools/spot-trade.ts` |
| spot plan orders | `classic/spot/plan/` | `packages/bitget-core/src/tools/spot-trade.ts` |
| futures market | `classic/contract/market/` | `packages/bitget-core/src/tools/futures-market.ts` |
| futures trade | `classic/contract/trade/` | `packages/bitget-core/src/tools/futures-trade.ts` |
| futures positions | `classic/contract/position/` | `packages/bitget-core/src/tools/futures-trade.ts` |
| futures plan orders | `classic/contract/plan/` | `packages/bitget-core/src/tools/futures-trade.ts` |
| account | `classic/spot/account/` + `classic/common/account/` + `classic/common/public/` | `packages/bitget-core/src/tools/account.ts` |
| margin | `classic/margin/` | `packages/bitget-core/src/tools/margin.ts` |
| copytrading | `classic/copytrading/` | `packages/bitget-core/src/tools/copy-trading.ts` |
| convert | `classic/spot/bgb-convert/` + `classic/spot/convert/` | `packages/bitget-core/src/tools/convert.ts` |
| earn | `classic/earn/` | `packages/bitget-core/src/tools/earn.ts` |
| p2p | `classic/p2p/` | `packages/bitget-core/src/tools/p2p.ts` |
| broker | `classic/broker/` | `packages/bitget-core/src/tools/broker.ts` |

---

## Architecture

### Components Affected

1. **`packages/bitget-core/src/tools/`** — Primary fix target. All tool implementations live here.
2. **`packages/bitget-mcp/`** — No direct changes needed; it calls `buildTools(config)` from bitget-core.
3. **`packages/bitget-skill/references/commands.md`** — Auto-generated from tool definitions; must be regenerated after fixes via `node packages/bitget-skill/scripts/gen-references.js`.
4. **`packages/bitget-test-utils/src/server/routes/`** — Mock server routes must be updated whenever endpoint paths change (before running tests, since tests depend on mock routes).

### What Does NOT Change
- The MCP server (`bitget-mcp/src/server.ts`) — pure adapter
- The CLI (`bitget-client/src/index.ts`) — calls tools by name
- The skill body (`bitget-skill/skills/SKILL.md`)
- Tool names — backwards compatible fixes only

---

## Approach: Parallel Audit then Fix

### Phase 1: Parallel Audit (read-only)

Spawn 6 parallel read-only agents (grouped to balance load). Each agent:
1. Reads all `.md` files in the assigned doc directories
2. Reads the corresponding tool implementation `.ts` file(s)
3. Produces a structured diff report

**Agent grouping:**
- **Agent 1:** spot-market + spot-trade + spot-plan (`classic/spot/market/`, `classic/spot/trade/`, `classic/spot/plan/` → `spot-market.ts`, `spot-trade.ts`)
- **Agent 2:** futures-market + futures-trade + futures-positions + futures-plan (`classic/contract/market/`, `classic/contract/trade/`, `classic/contract/position/`, `classic/contract/plan/` → `futures-market.ts`, `futures-trade.ts`)
- **Agent 3:** account (`classic/spot/account/`, `classic/common/account/`, `classic/common/public/` → `account.ts`)
- **Agent 4:** margin (`classic/margin/` → `margin.ts`)
- **Agent 5:** copytrading + convert (`classic/copytrading/`, `classic/spot/convert/`, `classic/spot/bgb-convert/` → `copy-trading.ts`, `convert.ts`)
- **Agent 6:** earn + p2p + broker (`classic/earn/`, `classic/p2p/`, `classic/broker/` → `earn.ts`, `p2p.ts`, `broker.ts`)

### Phase 2: Fix Implementation

After all audit reports are collected, implement all fixes in `bitget-core/src/tools/`. Fixes are minimal — only change what the docs say is wrong.

**Important:** Update mock server routes in `bitget-test-utils/src/server/routes/` whenever an endpoint path changes, before running tests.

Priority order within each module:
1. Wrong paths (breaks functionality completely)
2. Wrong HTTP method (GET vs POST)
3. Wrong/missing required parameters (causes API errors)
4. Wrong routing logic (wrong endpoint selected)
5. Missing endpoints (additive, lower risk)

### Phase 3: Verify

1. Run existing tests: `pnpm test` in `packages/bitget-core` (note: test coverage may not be exhaustive)
2. Check TypeScript: `pnpm build` in `packages/bitget-core`
3. Regenerate skill reference: `node packages/bitget-skill/scripts/gen-references.js` in `packages/bitget-skill`

---

## Audit Report Format

Each agent produces a report in this format:

```
## Module: <name>

### Tool: <tool_name>
- [PATH] Current: `/api/v2/...` → Should be: `/api/v2/...`
- [METHOD] Current: GET → Should be: POST
- [PARAM] Missing param: `fieldName` (required by doc)
- [PARAM] Wrong field name: `oldName` → `correctName`
- [ROUTING] Condition `X` should route to endpoint Y not Z
- [OK] Correct as-is

### Missing Endpoints (should be added to existing tool or as new tool)
- `<doc_file>` → maps to tool `<suggested_tool_name>`, endpoint `POST /api/v2/...`
```

---

## Key Constraints

- **No tool name changes** — existing users depend on tool names
- **Backwards compatible params** — adding new optional params is fine; removing required params is not
- **Classic V2 only** — all paths must be `/api/v2/...` (no V3 UTA paths)
- **Minimal diffs** — fix only what docs say is wrong; do not refactor surrounding code
- **Mock server sync** — if a route path changes, update the corresponding mock in `bitget-test-utils/src/server/routes/` before running tests
- **Out of scope modules** — `instloan`, `tax`, `affiliate`, `demotrading` are not in bitget-core and will not be added
