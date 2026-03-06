# Monorepo Restructure Design

**Date:** 2026-03-03
**Status:** Approved

## Summary

Restructure the current single-package `bitget-mcp-server` repo into a pnpm monorepo with four independently-publishable packages:

| Package | npm name | Binary |
|---|---|---|
| `packages/bitget-core` | `bitget-core` | — |
| `packages/bitget-mcp` | `bitget-mcp-server` | `bitget-mcp-server` |
| `packages/bitget-client` | `bitget-client` | `bgc` |
| `packages/bitget-skill` | `bitget-skill` | — |

## Repository Structure

```
agent_hub/
├── pnpm-workspace.yaml
├── package.json              # workspace root (private, never published)
├── tsconfig.base.json        # shared TypeScript config
└── packages/
    ├── bitget-core/
    ├── bitget-mcp/
    ├── bitget-client/
    └── bitget-skill/
```

## Package Designs

### `bitget-core` — Shared Library

Extracted from the current `src/`, this is the shared foundation all other packages depend on.

**Source layout:**
```
bitget-core/src/
├── client/       # rest-client.ts, types.ts
├── tools/        # all 56+ tool definitions
├── utils/        # errors, rate-limiter, signature
├── config.ts
└── constants.ts
```

**Public exports:**
```typescript
export { BitgetRestClient } from './client/rest-client.js'
export { buildTools } from './tools/index.js'
export { loadConfig } from './config.js'
export type { BitgetConfig } from './config.js'
export type { ToolSpec } from './tools/types.js'
export * from './utils/errors.js'
```

Published to npm as `bitget-core`. No binary. Versioned independently; breaking changes increment major version.

---

### `bitget-mcp` — MCP Server

Slim wrapper over `bitget-core`. Contains only MCP server wiring.

**Source layout:**
```
bitget-mcp/src/
├── index.ts    # CLI entry + stdio transport
└── server.ts   # MCP server creation
```

Depends on `bitget-core` and `@modelcontextprotocol/sdk`. Published as `bitget-mcp-server` (preserves existing npm name).

---

### `bitget-client` — `bgc` CLI

Command-line tool with one subcommand per API module. Outputs JSON by default for scriptability and skill integration. Optional `--pretty` flag for human-readable output.

**Command structure:**
```
bgc <module> <action> [options]

bgc spot ticker --symbol BTCUSDT
bgc spot orderbook --symbol BTCUSDT --limit 20
bgc futures positions
bgc account balance
bgc futures order --symbol BTCUSDT_UMCBL --side buy --size 0.01 --price 50000
```

**Modules:** `spot`, `futures`, `account`, `margin`, `copytrading`, `convert`, `earn`, `p2p`, `broker`

**Auth:** reads `BITGET_API_KEY`, `BITGET_SECRET_KEY`, `BITGET_PASSPHRASE` from environment. Also supports `~/.bgc/config.json`.

**Source layout:**
```
bitget-client/src/
├── index.ts         # entry point, routes subcommands
└── commands/
    ├── spot.ts
    ├── futures.ts
    ├── account.ts
    ├── margin.ts
    ├── copytrading.ts
    ├── convert.ts
    ├── earn.ts
    ├── p2p.ts
    └── broker.ts
```

Depends on `bitget-core`. Published as `bitget-client`, binary named `bgc`.

---

### `bitget-skill` — Claude Code Skill

Provides a rich skill file for Claude Code. When activated, Claude uses the `Bash` tool to invoke `bgc` and parse its JSON output.

**Package layout:**
```
bitget-skill/
├── skills/
│   └── bitget.md           # main skill definition
├── references/
│   ├── commands.md         # full bgc command reference (auto-generated)
│   ├── error-codes.md      # Bitget API error codes + recovery suggestions
│   └── auth-setup.md       # credential setup guide
├── scripts/
│   ├── install.js          # post-install: registers skill into ~/.claude/skills/
│   └── gen-references.js   # regenerates references from bitget-core tool specs
└── package.json
```

**Skill content (`bitget.md`) covers:**
1. Purpose and activation triggers
2. Prerequisites check (`bgc` in PATH, env vars)
3. Full command reference (via `references/commands.md`)
4. Auth setup guide
5. Error handling patterns
6. Read-only vs write operation distinctions
7. JSON output parsing guide

**`gen-references.js`** reads `bitget-core` tool definitions at build time and auto-generates `commands.md`, keeping the reference in sync with the actual API surface.

**Installation UX:**
```bash
npm install -g bitget-skill
# post-install: copies bitget.md → ~/.claude/skills/bitget.md
```

`bitget-client` is a `peerDependency` — user must have `bgc` in PATH.

---

## Monorepo Wiring

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - 'packages/*'
```

**Build order** (pnpm resolves automatically via workspace deps):
```
bitget-core → bitget-mcp, bitget-client → bitget-skill
```

**Root scripts:**
```json
{
  "build": "pnpm -r build",
  "typecheck": "pnpm -r typecheck",
  "dev": "pnpm -r --parallel dev"
}
```

---

## Migration Steps

1. Add `pnpm-workspace.yaml` at repo root
2. Create `packages/` directory
3. Move current `src/` → `packages/bitget-core/src/`; update all imports
4. Create slim `packages/bitget-mcp/src/` with only `index.ts` + `server.ts`; update deps
5. Scaffold `packages/bitget-client/` with `bgc` command structure
6. Scaffold `packages/bitget-skill/` with skill + reference files + install script
7. Add shared `tsconfig.base.json` at root; each package extends it
8. Run `pnpm install` at root to wire workspace deps
9. Verify `pnpm -r build` succeeds for all packages
