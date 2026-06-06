# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Bitget Agent Hub** — a pnpm monorepo that connects AI assistants to the Bitget crypto exchange. One shared core library (`bitget-core`) defines every Bitget API tool; three consumers expose those tools differently:

- **bitget-mcp-server** — MCP server (Claude Code, Cursor, Codex, etc.)
- **bitget-client** — `bgc` CLI (shell access, JSON output, for shell-based agents)
- **bitget-skill** / **bitget-skill-hub** — Claude Code / Codex / OpenClaw skills

`bitget-hub` is a standalone installer CLI (`npx bitget-hub`) that installs/upgrades/rolls back the published packages.

## Commands

Prerequisites: Node ≥ 18, pnpm ≥ 8.

```bash
pnpm install
pnpm -r build          # build all packages (tsup → dist/)
pnpm -r typecheck      # tsc --noEmit across all packages
pnpm -r test           # vitest run across all packages
```

Per-package (run from a package dir, e.g. `packages/bitget-core`):

```bash
pnpm build             # tsup
pnpm test              # vitest run
pnpm vitest run tests/tools/spot-trade.test.ts   # single test file
pnpm vitest run -t "round-trip"                  # single test by name
pnpm test:watch        # vitest watch mode
```

**Build order matters.** Consumers depend on `bitget-core` via `workspace:*` and import from its built `dist/` (`main: dist/index.js`), not its source. Always `pnpm -r build` (or build `bitget-core` first) before running consumer tests, the smoke test, or `gen-references`.

End-to-end / publishing:

```bash
node scripts/mcp-smoke-test.mjs        # spawns the built MCP server, calls real tools (needs build first)
node scripts/publish.mjs               # dry-run; --publish to actually publish in dependency order
```

## Architecture

### Tool definition is centralized

Every Bitget capability is a `ToolSpec` (see `packages/bitget-core/src/tools/types.ts`):

```ts
interface ToolSpec {
  name: string;          // e.g. "spot_get_ticker"
  module: ModuleId;      // spot | futures | account | margin | copytrading | convert | earn | p2p | broker
  description: string;
  inputSchema: JsonSchema;
  isWrite: boolean;      // true = mutating (place/cancel order, transfer)
  handler: (args, ctx) => Promise<unknown>;
}
```

Tools live in `packages/bitget-core/src/tools/<module>.ts`, each exporting a `register<Module>Tools()` that returns `ToolSpec[]`. `tools/index.ts#buildTools(config)` concatenates them all, then filters by:
1. enabled `config.modules` (default `spot + futures + account` = 36 tools, under Cursor's 40-tool cap; `--modules all` for everything)
2. `config.readOnly` — drops every `isWrite` tool

**To add a tool:** add a `ToolSpec` to the right `register*Tools()` array. It flows automatically into the MCP server, the CLI, capabilities, and generated skill references — no consumer changes needed.

**Endpoint paths are centralized** in `packages/bitget-core/src/api/` — one file per module exporting a `<MODULE>_ENDPOINTS` constant (grouped by API sub-resource, e.g. `SPOT_ENDPOINTS.trade.placeOrder`). Tool handlers import these instead of hardcoding `/api/v2/...` strings, so a path change happens in one place. Margin paths are scoped by margin type, so `api/margin.ts` exports a `marginEndpoint(marginType, suffix)` builder plus `MARGIN_ENDPOINTS` suffixes. When adding an endpoint, add the constant in `api/` first, then reference it from the handler. (This replaced the unmaintained `bitget-api-node-sdk` dependency, which was unused dead weight.)

### Consumers wrap the same ToolSpecs

- **MCP server** (`packages/bitget-mcp/src/server.ts`): maps each `ToolSpec` → MCP `Tool` (with `readOnlyHint`/`destructiveHint` from `isWrite`), plus a synthetic `system_get_capabilities` tool. Responses are wrapped in a `{ ok, data, capabilities, timestamp }` envelope.
- **CLI** (`packages/bitget-client/src/index.ts`): `bgc <module> <tool> --param value`. Parses `--key value` into tool args (coerces `true`/`false`, parses `[`/`{` as JSON), looks up the tool, runs its handler, prints JSON.

Both call `loadConfig()` then `buildTools()` then `handler(args, { config, client })`. The CLI and server are thin; logic lives in core.

### REST client & auth

`packages/bitget-core/src/client/rest-client.ts` — `publicGet` / `privateGet` / `privatePost`. Private requests are signed: `HMAC-SHA256(timestamp + METHOD + endpoint + body, secretKey)` → base64, set in `ACCESS-*` headers (`utils/signature.ts`). Credentials come from env only (`BITGET_API_KEY`, `BITGET_SECRET_KEY`, `BITGET_PASSPHRASE`); partial credentials throw. Paper/demo trading sets the `paptrading: 1` header. Bitget responses with `code !== "00000"` throw typed errors (`errors.ts`); auth codes `40017/40018/40036` → `AuthenticationError`. Client-side token-bucket rate limiting in `utils/rate-limiter.ts`.

### Earn module capability probing

`earn` tools may be unsupported on a given account. The server warms up / probes capability lazily (`getEarnCapabilityStatus`, `warmupEarnCapability` in `tools/earn.ts`) and hides earn tools from `list_tools` when `unsupported`. Keep this in mind when touching `earn` or the capability snapshot.

### Tests

Tests (vitest) run against a local in-process mock of the Bitget REST API: `bitget-test-utils` `MockServer` starts an HTTP server, and the test points `BITGET_API_BASE_URL` at it. Mock routes live in `packages/bitget-test-utils/src/server/routes/<module>.ts` with stateful behavior in `state.ts` (e.g. place-order then get-orders round-trips). When adding a tool that hits a new endpoint, add a matching mock route.

### Skill generation

`bitget-skill`'s `references/commands.md` is auto-generated from core tool specs via `scripts/gen-references.js` (`pnpm gen-references`, also run on `prepublishOnly`). It imports `buildTools` from built `bitget-core`, so build core first. Don't hand-edit generated reference files.

## Conventions

- **ESM + NodeNext**: all relative imports use `.js` extensions even in `.ts` source (e.g. `import { x } from "./config.js"`). Required by `moduleResolution: NodeNext`.
- **Strict TS** with `noUncheckedIndexedAccess` — array/record access is `T | undefined`; handle it.
- Tool handlers validate args via `tools/helpers.ts` (`requireString`, `readNumber`, `readObjectArray`, `assertEnum`, `compactObject`, …) — string-encoded JSON for arrays/objects is accepted so the CLI and MCP paths behave identically.
- Build tooling: `tsup` per package (config in each `tsup.config.ts`), shared compiler options in `tsconfig.base.json`.

## Code style

Adhere to the style rules in `.agent/code-style/` — `COMMON.md` (TS/JS + Dart), `BACK-END-STYLE.md` (Bun/Hono/Drizzle), `FRONT-END-STYLE.md` (JSX). Read them before editing. Key `COMMON.md` rules: object/interface/type members and array items each on their own line; never destructure; import specifiers on a single line (never wrapped); semicolons everywhere; single quotes; no trailing commas; never `any`; `if` always braces; chained calls break from the second dot onward; file names lowercase-hyphen.

**Conflict note:** existing `bitget-core` source predates this guide and uses double quotes, trailing commas, and multiline imports — the opposite of `COMMON.md`. New files follow `.agent/code-style`. When editing an existing file, match the surrounding file's formatting unless asked to reformat.
