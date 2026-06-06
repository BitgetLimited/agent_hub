# AI Context

Dense context for AI coding agents. Read `conventions.md` + `architecture.md` for detail.

## Project summary

pnpm monorepo connecting AI assistants to the Bitget exchange. `bitget-core` defines every Bitget capability as a typed `ToolSpec`; thin consumers (MCP server, `bgc` CLI, skills) re-expose them. 59 tools across 9 modules. Zero third-party runtime deps except `@modelcontextprotocol/sdk` (MCP only). Node ≥ 18, pnpm ≥ 8, TS strict + NodeNext ESM.

## Important entry points

- `packages/bitget-core/src/tools/index.ts` — `buildTools(config)` (concat + filter).
- `packages/bitget-core/src/tools/<module>.ts` — `register<Module>Tools()` arrays (where tools live).
- `packages/bitget-core/src/api/<module>.ts` — endpoint-path constants.
- `packages/bitget-core/src/client/rest-client.ts` — `BitgetRestClient` (publicGet/privateGet/privatePost).
- `packages/bitget-core/src/config.ts` — `loadConfig()`; `constants.ts` — `MODULES`, `DEFAULT_MODULES`, `SERVER_VERSION`.
- `packages/bitget-mcp/src/server.ts` — MCP mapping + envelope; `packages/bitget-client/src/index.ts` — CLI.
- `packages/bitget-test-utils/src/server/` — mock server + routes + `state.ts`.

## Core business logic / rules

- A tool is `{ name, module, description, inputSchema, isWrite, handler }`. `isWrite` is the read-only gate.
- Filtering: enabled `config.modules` → drop `isWrite` if `config.readOnly`. Default modules `spot,futures,account` (36 tools); `all` = 59.
- Single vs batch auto-routed by array length (e.g. `place_order` vs batch). Money/price/size are **strings**.
- Private requests signed `base64(HMAC-SHA256(timestamp+METHOD+path+body, secret))`; creds env-only.
- Bitget `code !== "00000"` ⇒ typed throw; `40017/40018/40036` ⇒ `AuthenticationError`.
- `earn` is capability-probed and hidden when unsupported.

## Architecture notes (before modifying)

- Consumers import core's built `dist/` — **build `bitget-core` before** consumer tests, smoke test, or gen-references: `pnpm -r build` (or build core first).
- Adding a `ToolSpec` propagates everywhere automatically — no consumer edits.
- Endpoint paths live in `api/` only; margin uses `marginEndpoint(marginType, suffix)`.
- Mock server matches exact `/api/v2/...` routes — wrong constant ⇒ failing test.

## Common tasks

- **Add a tool** → add endpoint to `api/<module>.ts`; add `ToolSpec` to `register*Tools()`; add mock route; build + test. (see `conventions.md`).
- **Add a module** → new `api/<module>.ts` + `tools/<module>.ts` with `register*Tools()`; import in `tools/index.ts`; add to `MODULES` (`constants.ts`); add mock routes.
- **Change an endpoint path** → edit the constant in `api/` (one place).
- **Run one test** → `pnpm vitest run tests/tools/<file>.test.ts` (build core first).
- **Smoke test** → `node scripts/mcp-smoke-test.mjs` (needs build + creds).

## Do not break

- `isWrite` flags — they gate `--read-only` and MCP `destructiveHint`. Mislabeling exposes writes in read-only mode.
- HMAC signing input order `timestamp + METHOD + requestPath + body` and `ACCESS-*` headers.
- `.js` import extensions (NodeNext). Removing them breaks the build.
- Exact endpoint strings in `api/` — they're contract with both Bitget and the mock.
- Credentials stay env-only; never log/persist them.
- Write tools are irreversible (orders/transfers/withdrawals) — no undo, no server-side caps.
- Don't hand-edit generated `bitget-skill/references/commands.md`.

## AI working rules

- Follow `conventions.md` and `.agent/code-style/`. Reuse existing helpers (`tools/helpers.ts`) and the `ToolSpec`/`api/` patterns.
- Prefer existing abstractions; don't add frameworks or runtime deps.
- Validate args with helpers; throw typed errors; return `normalize(response)`.
- Keep money/price/size as strings; constrain with `enum`; write rich tool descriptions with auth + rate limit + `[CAUTION]`.
- After changes: `pnpm -r build && pnpm -r typecheck && pnpm -r test`.

## Known issue

`bitget-client` vitest suite fails on Windows from a test-harness path bug (`URL().pathname` → `D:\D:\...`, "Cannot find module"); unrelated to product code, passes on Linux/CI. The CLI runs fine directly.
