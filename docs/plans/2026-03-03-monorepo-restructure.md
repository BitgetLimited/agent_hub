# Monorepo Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the single-package `bitget-mcp-server` repo into a pnpm monorepo with four independently-publishable packages: `bitget-core`, `bitget-mcp-server`, `bitget-client` (bgc CLI), and `bitget-skill`.

**Architecture:** Extract all API logic into a shared `bitget-core` library; `bitget-mcp` and `bitget-client` become thin consumers of core. `bitget-skill` provides a Claude Code skill that invokes `bgc` via Bash for real-time API calls.

**Tech Stack:** TypeScript, pnpm workspaces, tsup (build), Node.js ≥18

---

## Task 1: Initialize pnpm workspace

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Modify: `package.json` (root — make private workspace root)

**Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
```

**Step 2: Create `tsconfig.base.json` at repo root**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": false
  }
}
```

**Step 3: Replace root `package.json`**

```json
{
  "name": "agent-hub",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "dev": "pnpm -r --parallel dev"
  },
  "engines": {
    "node": ">=18"
  }
}
```

**Step 4: Create packages directory**

```bash
mkdir -p packages
```

**Step 5: Commit**

```bash
git add pnpm-workspace.yaml tsconfig.base.json package.json
git commit -m "chore: initialize pnpm workspace"
```

---

## Task 2: Create `bitget-core` package

**Files:**
- Create: `packages/bitget-core/package.json`
- Create: `packages/bitget-core/tsconfig.json`
- Create: `packages/bitget-core/tsup.config.ts`
- Move: `src/client/` → `packages/bitget-core/src/client/`
- Move: `src/tools/` → `packages/bitget-core/src/tools/`
- Move: `src/utils/` → `packages/bitget-core/src/utils/`
- Move: `src/config.ts` → `packages/bitget-core/src/config.ts`
- Move: `src/constants.ts` → `packages/bitget-core/src/constants.ts`
- Create: `packages/bitget-core/src/index.ts`

**Step 1: Create `packages/bitget-core/package.json`**

```json
{
  "name": "bitget-core",
  "version": "1.0.0",
  "description": "Shared core library for Bitget API client and tools",
  "type": "module",
  "license": "MIT",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run typecheck && npm run build"
  },
  "engines": { "node": ">=18" },
  "dependencies": {
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@types/node": "^25.2.2",
    "tsup": "^8.5.1",
    "typescript": "^5.9.3"
  }
}
```

**Step 2: Create `packages/bitget-core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*.ts", "tsup.config.ts"],
  "exclude": ["dist", "node_modules"]
}
```

**Step 3: Create `packages/bitget-core/tsup.config.ts`**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node18",
  sourcemap: true,
  clean: true,
  dts: true,
});
```

**Step 4: Copy source files into `packages/bitget-core/src/`**

```bash
mkdir -p packages/bitget-core/src
cp -r src/client packages/bitget-core/src/
cp -r src/tools packages/bitget-core/src/
cp -r src/utils packages/bitget-core/src/
cp src/config.ts packages/bitget-core/src/
cp src/constants.ts packages/bitget-core/src/
```

**Step 5: Create `packages/bitget-core/src/index.ts`**

```typescript
export { BitgetRestClient } from "./client/rest-client.js";
export type { RestClientConfig } from "./client/types.js";
export { buildTools } from "./tools/index.js";
export { loadConfig } from "./config.js";
export type { BitgetConfig, CliOptions } from "./config.js";
export type { ToolSpec } from "./tools/types.js";
export { toMcpTool } from "./tools/types.js";
export { SERVER_NAME, SERVER_VERSION, MODULES, DEFAULT_MODULES } from "./constants.js";
export type { ModuleId } from "./constants.js";
export { BitgetApiError, ConfigError, toToolErrorPayload } from "./utils/errors.js";
export { getEarnCapabilityStatus, warmupEarnCapability } from "./tools/earn.js";
```

**Step 6: Build and verify**

```bash
cd packages/bitget-core && pnpm install && pnpm build
```

Expected: `dist/` created with `index.js` and `index.d.ts`

**Step 7: Commit**

```bash
git add packages/bitget-core
git commit -m "feat: add bitget-core shared library package"
```

---

## Task 3: Create slim `bitget-mcp` package

**Files:**
- Create: `packages/bitget-mcp/package.json`
- Create: `packages/bitget-mcp/tsconfig.json`
- Create: `packages/bitget-mcp/tsup.config.ts`
- Create: `packages/bitget-mcp/src/index.ts` (from current `src/index.ts`)
- Create: `packages/bitget-mcp/src/server.ts` (from current `src/server.ts`)

**Step 1: Create `packages/bitget-mcp/package.json`**

```json
{
  "name": "bitget-mcp-server",
  "version": "1.0.6",
  "description": "Official Bitget MCP Server",
  "type": "module",
  "license": "MIT",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "bitget-mcp-server": "dist/index.js"
  },
  "files": ["dist", "README.md"],
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run typecheck && npm run build"
  },
  "engines": { "node": ">=18" },
  "keywords": ["bitget", "mcp", "model-context-protocol", "trading"],
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.26.0",
    "bitget-core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^25.2.2",
    "tsup": "^8.5.1",
    "typescript": "^5.9.3"
  }
}
```

**Step 2: Create `packages/bitget-mcp/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*.ts", "tsup.config.ts"],
  "exclude": ["dist", "node_modules"]
}
```

**Step 3: Create `packages/bitget-mcp/tsup.config.ts`**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node18",
  sourcemap: true,
  clean: true,
  dts: true,
  banner: { js: "#!/usr/bin/env node" },
});
```

**Step 4: Create `packages/bitget-mcp/src/index.ts`**

Copy current `src/index.ts` and update the import paths to use `bitget-core`:

```typescript
import { parseArgs } from "node:util";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, SERVER_NAME, SERVER_VERSION, toToolErrorPayload } from "bitget-core";
import { createServer } from "./server.js";

function printHelp(): void {
  const help = `
Usage: ${SERVER_NAME} [options]

Options:
  --modules <list>     Comma-separated list of modules to load
                       Available: spot, futures, account, margin, copytrading,
                       convert, earn, p2p, broker
                       Special: "all" loads all modules
                       Default: spot,futures,account

  --read-only          Expose only read/query tools and disable write operations
  --help               Show this help message
  --version            Show version

Environment Variables:
  BITGET_API_KEY       Bitget API key (required for private endpoints)
  BITGET_SECRET_KEY    Bitget secret key (required for private endpoints)
  BITGET_PASSPHRASE    Bitget passphrase (required for private endpoints)
  BITGET_API_BASE_URL  Optional API base URL (default: https://api.bitget.com)
  BITGET_TIMEOUT_MS    Optional request timeout in milliseconds (default: 15000)
`;
  process.stdout.write(help);
}

function parseCli(): { modules?: string; readOnly: boolean; help: boolean; version: boolean } {
  const parsed = parseArgs({
    options: {
      modules: { type: "string" },
      "read-only": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
      version: { type: "boolean", default: false },
    },
    allowPositionals: false,
  });
  return {
    modules: parsed.values.modules,
    readOnly: parsed.values["read-only"],
    help: parsed.values.help,
    version: parsed.values.version,
  };
}

export async function main(): Promise<void> {
  const cli = parseCli();
  if (cli.help) { printHelp(); return; }
  if (cli.version) { process.stdout.write(`${SERVER_VERSION}\n`); return; }
  const config = loadConfig({ modules: cli.modules, readOnly: cli.readOnly });
  const server = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const payload = toToolErrorPayload(error);
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = 1;
});
```

**Step 5: Create `packages/bitget-mcp/src/server.ts`**

Copy current `src/server.ts` and update all imports to use `bitget-core`:

```typescript
// Replace all relative imports like:
//   import { BitgetRestClient } from "./client/rest-client.js"
//   import { buildTools } from "./tools/index.js"
//   import type { BitgetConfig } from "./config.js"
//   etc.
// With:
//   import { BitgetRestClient, buildTools, ... } from "bitget-core"
```

Concretely, change the import block at the top of server.ts to:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {
  BitgetRestClient,
  BitgetApiError,
  buildTools,
  getEarnCapabilityStatus,
  loadConfig,
  toMcpTool,
  toToolErrorPayload,
  warmupEarnCapability,
  MODULES,
  SERVER_NAME,
  SERVER_VERSION,
} from "bitget-core";
import type { BitgetConfig, ModuleId, ToolSpec } from "bitget-core";
```

The rest of `server.ts` body is identical to the current version.

**Step 6: Build and verify**

```bash
cd packages/bitget-mcp && pnpm install && pnpm build
```

Expected: `dist/index.js` created, no TypeScript errors

**Step 7: Commit**

```bash
git add packages/bitget-mcp
git commit -m "feat: add bitget-mcp package consuming bitget-core"
```

---

## Task 4: Scaffold `bitget-client` (`bgc` CLI)

**Files:**
- Create: `packages/bitget-client/package.json`
- Create: `packages/bitget-client/tsconfig.json`
- Create: `packages/bitget-client/tsup.config.ts`
- Create: `packages/bitget-client/src/index.ts`
- Create: `packages/bitget-client/src/commands/spot.ts`
- Create: `packages/bitget-client/src/commands/futures.ts`
- Create: `packages/bitget-client/src/commands/account.ts`
- Create: `packages/bitget-client/src/commands/margin.ts`
- Create: `packages/bitget-client/src/commands/copytrading.ts`
- Create: `packages/bitget-client/src/commands/convert.ts`
- Create: `packages/bitget-client/src/commands/earn.ts`
- Create: `packages/bitget-client/src/commands/p2p.ts`
- Create: `packages/bitget-client/src/commands/broker.ts`

**Step 1: Create `packages/bitget-client/package.json`**

```json
{
  "name": "bitget-client",
  "version": "1.0.0",
  "description": "Bitget CLI tool — bgc",
  "type": "module",
  "license": "MIT",
  "main": "dist/index.js",
  "bin": {
    "bgc": "dist/index.js"
  },
  "files": ["dist", "README.md"],
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run typecheck && npm run build"
  },
  "engines": { "node": ">=18" },
  "keywords": ["bitget", "cli", "bgc", "trading"],
  "dependencies": {
    "bitget-core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^25.2.2",
    "tsup": "^8.5.1",
    "typescript": "^5.9.3"
  }
}
```

**Step 2: Create `packages/bitget-client/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src/**/*.ts", "tsup.config.ts"],
  "exclude": ["dist", "node_modules"]
}
```

**Step 3: Create `packages/bitget-client/tsup.config.ts`**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node18",
  sourcemap: true,
  clean: true,
  dts: false,
  banner: { js: "#!/usr/bin/env node" },
});
```

**Step 4: Create `packages/bitget-client/src/index.ts`**

This is the CLI entry point. It loads config, builds tools, finds the requested tool by name, and calls its handler.

```typescript
import { parseArgs } from "node:util";
import { loadConfig, buildTools } from "bitget-core";

function printHelp(): void {
  process.stdout.write(`
Usage: bgc <module> <tool> [--param value ...]

Modules: spot, futures, account, margin, copytrading, convert, earn, p2p, broker

Examples:
  bgc spot spot_get_ticker --symbol BTCUSDT
  bgc futures futures_get_positions
  bgc account account_get_balance

Options:
  --read-only     Only allow read/query tools
  --pretty        Pretty-print JSON output
  --help          Show this help
  --version       Show version

Auth (environment variables):
  BITGET_API_KEY, BITGET_SECRET_KEY, BITGET_PASSPHRASE
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.includes("--help") || argv.length === 0) {
    printHelp();
    return;
  }

  if (argv.includes("--version")) {
    // dynamic import to avoid circular at build time
    const { SERVER_VERSION } = await import("bitget-core");
    process.stdout.write(`bgc (bitget-client) using bitget-core ${SERVER_VERSION}\n`);
    return;
  }

  // First positional = module, second = tool name
  const [module, toolName, ...rest] = argv.filter((a) => !a.startsWith("--"));
  if (!module || !toolName) {
    process.stderr.write("Error: provide <module> <tool>\n");
    process.exitCode = 1;
    return;
  }

  const pretty = process.argv.includes("--pretty");
  const readOnly = process.argv.includes("--read-only");

  // Parse remaining --key value pairs as tool arguments
  const toolArgs: Record<string, unknown> = {};
  const flagArgs = process.argv.slice(2).filter((a) => a.startsWith("--"));
  for (let i = 0; i < flagArgs.length; i++) {
    const key = flagArgs[i].replace(/^--/, "");
    if (key === "pretty" || key === "read-only") continue;
    const value = flagArgs[i + 1];
    if (value && !value.startsWith("--")) {
      toolArgs[key] = value;
      i++;
    } else {
      toolArgs[key] = true;
    }
  }

  const config = loadConfig({ modules: module, readOnly });
  const { BitgetRestClient } = await import("bitget-core");
  const client = new BitgetRestClient(config);
  const tools = buildTools(config);
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    process.stderr.write(`Error: tool "${toolName}" not found in module "${module}"\n`);
    process.exitCode = 1;
    return;
  }

  try {
    const result = await tool.handler(toolArgs, { config, client });
    const output = pretty
      ? JSON.stringify(result, null, 2)
      : JSON.stringify(result);
    process.stdout.write(output + "\n");
  } catch (err: unknown) {
    const { toToolErrorPayload } = await import("bitget-core");
    const payload = toToolErrorPayload(err);
    process.stderr.write(JSON.stringify(payload, null, 2) + "\n");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exitCode = 1;
});
```

**Step 5: Build and smoke test**

```bash
cd packages/bitget-client && pnpm install && pnpm build
node dist/index.js --help
```

Expected: help text printed, no errors

**Step 6: Commit**

```bash
git add packages/bitget-client
git commit -m "feat: add bitget-client (bgc) CLI package"
```

---

## Task 5: Scaffold `bitget-skill` package

**Files:**
- Create: `packages/bitget-skill/package.json`
- Create: `packages/bitget-skill/skills/bitget.md`
- Create: `packages/bitget-skill/references/auth-setup.md`
- Create: `packages/bitget-skill/references/error-codes.md`
- Create: `packages/bitget-skill/scripts/install.js`
- Create: `packages/bitget-skill/scripts/gen-references.js`

**Step 1: Create `packages/bitget-skill/package.json`**

```json
{
  "name": "bitget-skill",
  "version": "1.0.0",
  "description": "Claude Code skill for Bitget API via bgc CLI",
  "type": "module",
  "license": "MIT",
  "files": ["skills", "references", "scripts"],
  "publishConfig": { "access": "public" },
  "scripts": {
    "postinstall": "node scripts/install.js",
    "gen-references": "node scripts/gen-references.js"
  },
  "engines": { "node": ">=18" },
  "keywords": ["bitget", "claude-code", "skill", "trading"],
  "peerDependencies": {
    "bitget-client": ">=1.0.0"
  }
}
```

**Step 2: Create `packages/bitget-skill/references/auth-setup.md`**

```markdown
# Bitget API Authentication Setup

## Environment Variables (recommended)

Set these before running bgc:

```bash
export BITGET_API_KEY="your-api-key"
export BITGET_SECRET_KEY="your-secret-key"
export BITGET_PASSPHRASE="your-passphrase"
```

## Get API Credentials

1. Log in to https://www.bitget.com
2. Go to Settings → API Management
3. Create a new API key with the permissions you need:
   - Read Only: for market data and account queries
   - Trade: for placing/cancelling orders

## Read-Only Mode

To prevent any write operations:
```bash
bgc --read-only spot spot_get_ticker --symbol BTCUSDT
```
```

**Step 3: Create `packages/bitget-skill/references/error-codes.md`**

```markdown
# Bitget Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `AUTH_MISSING` | No API credentials set | Set BITGET_API_KEY, BITGET_SECRET_KEY, BITGET_PASSPHRASE |
| `RATE_LIMITED` | Too many requests | Wait 1 second and retry |
| `INVALID_SYMBOL` | Unknown trading pair | Check symbol format, e.g. BTCUSDT not BTC/USDT |
| `INSUFFICIENT_BALANCE` | Not enough funds | Check account balance first |
| `MODULE_FILTERED` | Module not enabled | Add module to --modules flag |
| `TOOL_NOT_AVAILABLE` | Tool not in current session | Call bgc <module> --help |
| `CONFIG_ERROR` | Invalid configuration | Check env vars and flags |
```

**Step 4: Create `packages/bitget-skill/scripts/gen-references.js`**

```javascript
#!/usr/bin/env node
// Generates references/commands.md from bitget-core tool specs
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const refsDir = join(__dirname, "..", "references");
mkdirSync(refsDir, { recursive: true });

// Import all tool registrars from bitget-core
const coreTools = await import("bitget-core");
const { buildTools, loadConfig } = coreTools;

const config = loadConfig({ modules: "all", readOnly: false });
const tools = buildTools(config);

const lines = [
  "# bgc Command Reference",
  "",
  "Auto-generated from bitget-core tool definitions.",
  "",
  "## Usage",
  "",
  "```",
  "bgc <module> <tool_name> [--param value ...]",
  "```",
  "",
];

const byModule = {};
for (const tool of tools) {
  if (!byModule[tool.module]) byModule[tool.module] = [];
  byModule[tool.module].push(tool);
}

for (const [module, moduleTools] of Object.entries(byModule)) {
  lines.push(`## Module: ${module}`, "");
  for (const tool of moduleTools) {
    lines.push(`### \`${tool.name}\``);
    lines.push("");
    lines.push(tool.description);
    lines.push("");
    lines.push(`**Write operation:** ${tool.isWrite ? "Yes — requires confirmation" : "No"}`);
    lines.push("");

    const props = tool.inputSchema?.properties ?? {};
    const required = tool.inputSchema?.required ?? [];
    if (Object.keys(props).length > 0) {
      lines.push("**Parameters:**", "");
      lines.push("| Name | Type | Required | Description |");
      lines.push("|------|------|----------|-------------|");
      for (const [name, schema] of Object.entries(props)) {
        const req = required.includes(name) ? "Yes" : "No";
        const desc = schema.description ?? "";
        lines.push(`| \`${name}\` | ${schema.type ?? "any"} | ${req} | ${desc} |`);
      }
      lines.push("");
    }

    lines.push("**Example:**", "```bash");
    const exampleArgs = Object.entries(props)
      .slice(0, 2)
      .map(([k]) => `--${k} <value>`)
      .join(" ");
    lines.push(`bgc ${module} ${tool.name}${exampleArgs ? " " + exampleArgs : ""}`);
    lines.push("```", "");
  }
}

writeFileSync(join(refsDir, "commands.md"), lines.join("\n"), "utf8");
console.log(`Generated references/commands.md (${tools.length} tools)`);
```

**Step 5: Create `packages/bitget-skill/scripts/install.js`**

```javascript
#!/usr/bin/env node
// Post-install: copies skill file into ~/.claude/skills/
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(homedir(), ".claude", "skills");
const refsDir = join(homedir(), ".claude", "skills", "bitget-references");

try {
  mkdirSync(skillsDir, { recursive: true });
  mkdirSync(refsDir, { recursive: true });

  const skillSrc = join(__dirname, "..", "skills", "bitget.md");
  const skillDst = join(skillsDir, "bitget.md");
  copyFileSync(skillSrc, skillDst);

  const refFiles = ["commands.md", "error-codes.md", "auth-setup.md"];
  for (const f of refFiles) {
    const src = join(__dirname, "..", "references", f);
    if (existsSync(src)) {
      copyFileSync(src, join(refsDir, f));
    }
  }

  console.log(`✓ Bitget skill installed to ${skillDst}`);
} catch (err) {
  // Non-fatal — skill can be installed manually
  console.warn("Could not auto-install skill:", err.message);
}
```

**Step 6: Create `packages/bitget-skill/skills/bitget.md`**

```markdown
---
name: bitget
description: >
  Use when the user asks about Bitget exchange data, trading, account info,
  or wants to place/manage orders. Provides real-time access to Bitget APIs
  via the bgc CLI.
---

# Bitget Skill

You have access to the Bitget cryptocurrency exchange via the `bgc` CLI tool.

## Prerequisites Check

Before executing any command, verify:

1. `bgc` is available:
   ```bash
   bgc --version
   ```
   If not found, instruct the user to run: `npm install -g bitget-client`

2. For private endpoints (account, trading), credentials must be set:
   See `~/.claude/skills/bitget-references/auth-setup.md` for setup instructions.

## How to Call the API

Use the Bash tool to run `bgc` commands. All output is JSON.

```bash
bgc <module> <tool_name> [--param value ...]
```

## Full Command Reference

See `~/.claude/skills/bitget-references/commands.md` for the complete list of
all available tools, their parameters, and examples.

## Modules

| Module | Description |
|--------|-------------|
| `spot` | Spot market data and trading |
| `futures` | Futures/perpetuals market and trading |
| `account` | Account balances and info |
| `margin` | Margin trading |
| `copytrading` | Copy trading |
| `convert` | Asset conversion |
| `earn` | Earn/staking products |
| `p2p` | P2P trading |
| `broker` | Broker operations |

## Safety Rules

- Write operations (orders, withdrawals) require explicit user confirmation
- Check `~/.claude/skills/bitget-references/error-codes.md` for error recovery
- Use `--read-only` flag when the user only wants to query data

## Error Handling

If `bgc` returns an error JSON, read `ok: false` and `error.suggestion` to determine
the recovery action. Common fixes in `~/.claude/skills/bitget-references/error-codes.md`.

## Output Parsing

`bgc` returns raw API response JSON. Key fields:
- `data` — the actual result
- `endpoint` — which API endpoint was called
- `requestTime` — when the request was made
```

**Step 7: Run gen-references to create commands.md**

```bash
cd packages/bitget-skill && node scripts/gen-references.js
```

Expected: `references/commands.md` created

**Step 8: Commit**

```bash
git add packages/bitget-skill
git commit -m "feat: add bitget-skill Claude Code skill package"
```

---

## Task 6: Wire workspace and final verification

**Step 1: Install all workspace deps from root**

```bash
cd /path/to/agent_hub && pnpm install
```

Expected: `node_modules/` created at root, workspace symlinks set up

**Step 2: Build all packages in dependency order**

```bash
pnpm -r build
```

Expected: all four packages build without errors

**Step 3: Typecheck all packages**

```bash
pnpm -r typecheck
```

Expected: no TypeScript errors

**Step 4: Smoke test bgc**

```bash
node packages/bitget-client/dist/index.js --help
node packages/bitget-client/dist/index.js spot spot_get_ticker --symbol BTCUSDT
```

Expected: help text, then ticker JSON (public endpoint, no auth needed)

**Step 5: Verify old root `src/` can be deleted**

Confirm both `bitget-mcp` and `bitget-core` packages have their own complete `src/`. Then:

```bash
git rm -r src/ tsup.config.ts tsconfig.json
# Keep: package.json (now workspace root), pnpm-workspace.yaml, tsconfig.base.json
```

Update root `package.json` to remove old scripts that referenced the root `src/`.

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: remove old root src/ — fully migrated to monorepo packages"
```

---

## Summary

| Package | npm name | Binary | Depends on |
|---|---|---|---|
| `packages/bitget-core` | `bitget-core` | — | zod |
| `packages/bitget-mcp` | `bitget-mcp-server` | `bitget-mcp-server` | bitget-core, @mcp/sdk |
| `packages/bitget-client` | `bitget-client` | `bgc` | bitget-core |
| `packages/bitget-skill` | `bitget-skill` | — | peer: bitget-client |
