# Demo Trading Support Design

**Date:** 2026-03-13
**Status:** Approved

## Background

Bitget's Demo Trading environment lets users trade with virtual funds against real market data. To use it, every API request must include the `paptrading: 1` header, and a dedicated Demo API Key must be used (separate from live trading keys).

Currently, neither `bitget-core`, `bitget-client` (bgc CLI), `bitget-mcp`, nor `bitget-skill` support demo trading.

## Approach

**Option A (chosen):** Add `--paper-trading` CLI flag to `bgc` and `bitget-mcp`. Propagate through `BitgetConfig`. Inject `paptrading: 1` header in `BitgetRestClient` when enabled.

Rejected alternatives:
- **Option B** (separate `DemoBitgetRestClient`): unnecessary subclassing, duplicates code
- **Option C** (per-tool `paperTrading` param): touches all tool definitions, over-engineered

## Changes

### 1. `bitget-core/src/config.ts`

Add `paperTrading: boolean` to both `CliOptions` and `BitgetConfig`. Read from `cli.paperTrading` in `loadConfig()`.

```ts
export interface CliOptions {
  modules?: string;
  readOnly: boolean;
  paperTrading: boolean;   // NEW
}

export interface BitgetConfig {
  // ...existing fields...
  paperTrading: boolean;   // NEW
}
```

### 2. `bitget-core/src/client/rest-client.ts`

In `request()`, after building headers, conditionally add `paptrading: 1`:

```ts
if (this.config.paperTrading) {
  headers.set("paptrading", "1");
}
```

Applied to all requests (public and private) since the Bitget docs require it on all demo endpoints.

### 3. `bitget-client/src/index.ts` (bgc CLI)

- Add `--paper-trading` to help text and skip list
- Parse the flag and pass `paperTrading` to `loadConfig()`

```bash
bgc --paper-trading spot spot_get_ticker --symbol BTCUSDT
bgc --paper-trading futures futures_place_order ...
```

### 4. `bitget-mcp/src/index.ts` (MCP server)

- Add `"paper-trading": { type: "boolean", default: false }` to `parseArgs`
- Pass `paperTrading` to `loadConfig()`
- Update help text

MCP server startup with demo mode:
```bash
bitget-mcp --paper-trading --modules spot,futures,account
```

### 5. `bitget-skill/references/demo-trading.md` (new file)

Reference doc covering:
- What Demo Trading is and when to use it
- How to create a Demo API Key on Bitget
- How to use `bgc --paper-trading` for CLI trading
- How to configure `bitget-mcp` with `--paper-trading`
- Important caveats (Demo key ≠ live key, cannot mix)

### 6. `bitget-skill` main skill file

Add a "Demo Trading Mode" section that:
- Explains when to use demo mode
- References `demo-trading.md` for setup steps
- Instructs AI to add `--paper-trading` to all `bgc` commands when in demo mode

## Data Flow

```
User sets Demo API Key credentials
       ↓
bgc --paper-trading / bitget-mcp --paper-trading
       ↓
loadConfig() → BitgetConfig { paperTrading: true }
       ↓
BitgetRestClient.request() → headers: { paptrading: "1", ... }
       ↓
Bitget Demo API
```

## Testing

- Unit test: `BitgetRestClient` sets `paptrading: 1` header when `paperTrading: true`
- Unit test: `loadConfig()` correctly maps CLI flag to config field
- No new integration tests needed (demo env is an external service)

## Non-Goals

- No `BITGET_PAPER_TRADING` env var (CLI flag only, as decided)
- No per-request switching between live and demo
- No changes to tool definitions or schemas
