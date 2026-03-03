<p align="center">
  <img src="assets/logo.png" alt="Bitget" width="120" />
</p>

<h1 align="center">Bitget Agent Hub</h1>

<p align="center">
  <strong>Connect AI assistants to Bitget — trade, query, and manage your crypto portfolio through natural language.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/bitget-mcp-server"><img src="https://img.shields.io/npm/v/bitget-mcp-server.svg?style=flat-square&color=cb3837" alt="MCP Server" /></a>
  <a href="https://www.npmjs.com/package/bitget-client"><img src="https://img.shields.io/npm/v/bitget-client.svg?style=flat-square&color=0070f3" alt="CLI" /></a>
  <a href="https://www.npmjs.com/package/bitget-core"><img src="https://img.shields.io/npm/v/bitget-core.svg?style=flat-square&color=6f42c1" alt="Core" /></a>
  <a href="https://www.npmjs.com/package/bitget-skill"><img src="https://img.shields.io/npm/v/bitget-skill.svg?style=flat-square&color=28a745" alt="Skill" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-compatible-8A2BE2?style=flat-square" alt="MCP compatible" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/bitget-mcp-server.svg?style=flat-square" alt="license" /></a>
</p>

<p align="center">
  <a href="#packages">Packages</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#modules">Modules</a> •
  <a href="#configuration">Configuration</a> •
  <a href="docs/">Documentation</a>
</p>

---

## What is this?

**Bitget Agent Hub** is a monorepo providing multiple ways to connect AI assistants and CLI tools to the [Bitget](https://www.bitget.com) cryptocurrency exchange.

| Package | Description | Install |
|---------|-------------|---------|
| [`bitget-mcp-server`](packages/bitget-mcp/) | MCP server for AI assistants (Claude, Cursor, Copilot…) | `npx bitget-mcp-server` |
| [`bitget-client`](packages/bitget-client/) | CLI tool (`bgc`) for terminal use and scripting | `npm install -g bitget-client` |
| [`bitget-skill`](packages/bitget-skill/) | Claude Code skill — AI uses `bgc` as a live API bridge | `npm install -g bitget-skill` |
| [`bitget-core`](packages/bitget-core/) | Shared API client + tool definitions library | `npm install bitget-core` |

> **56+ tools.** Spot, futures, margin, copy trading, convert, earn, P2P, broker.

---

## Packages

### `bitget-mcp-server` — MCP Server

Gives AI assistants direct access to Bitget through the [Model Context Protocol](https://modelcontextprotocol.io). Works with **Cursor**, **Claude Desktop**, **VS Code Copilot**, **Windsurf**, and any MCP-compatible client.

```bash
npx -y bitget-mcp-server --modules all
```

→ [Full documentation](docs/packages/bitget-mcp.md)

---

### `bgc` — CLI Tool

A command-line interface covering the same 56+ API tools. Outputs JSON by default — ideal for scripting, automation, and piping to other tools.

```bash
npm install -g bitget-client

bgc spot spot_get_ticker --symbol BTCUSDT
bgc futures futures_get_positions
bgc account account_get_balance
```

→ [Full documentation](docs/packages/bitget-client.md)

---

### `bitget-skill` — Claude Code Skill

A [Claude Code skill](https://docs.anthropic.com/en/docs/claude-code) that enables Claude to call Bitget APIs in real time by running `bgc` commands through the Bash tool.

```bash
npm install -g bitget-skill
# Skill is auto-installed to ~/.claude/skills/bitget.md
```

→ [Full documentation](docs/packages/bitget-skill.md)

---

### `bitget-core` — Shared Library

The shared foundation used by all other packages. Provides the REST client, tool definitions, auth, and rate limiting. Use it to build your own Bitget integrations.

```bash
npm install bitget-core
```

→ [Full documentation](docs/packages/bitget-core.md)

---

## Quick Start

### MCP Server (AI Assistants)

**Claude Desktop** — add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bitget": {
      "command": "npx",
      "args": ["-y", "bitget-mcp-server", "--modules", "all"],
      "env": {
        "BITGET_API_KEY": "your-api-key",
        "BITGET_SECRET_KEY": "your-secret-key",
        "BITGET_PASSPHRASE": "your-passphrase"
      }
    }
  }
}
```

<details>
<summary><strong>Cursor</strong></summary>

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "bitget": {
      "command": "npx",
      "args": ["-y", "bitget-mcp-server", "--modules", "all"],
      "env": {
        "BITGET_API_KEY": "your-api-key",
        "BITGET_SECRET_KEY": "your-secret-key",
        "BITGET_PASSPHRASE": "your-passphrase"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Claude Code (CLI)</strong></summary>

```bash
claude mcp add \
  --transport stdio \
  --env BITGET_API_KEY=your-api-key \
  --env BITGET_SECRET_KEY=your-secret-key \
  --env BITGET_PASSPHRASE=your-passphrase \
  bitget \
  -- npx -y bitget-mcp-server --modules all
```

</details>

<details>
<summary><strong>VS Code (Copilot)</strong></summary>

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "bitget": {
      "command": "npx",
      "args": ["-y", "bitget-mcp-server", "--modules", "all"],
      "env": {
        "BITGET_API_KEY": "your-api-key",
        "BITGET_SECRET_KEY": "your-secret-key",
        "BITGET_PASSPHRASE": "your-passphrase"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Windsurf</strong></summary>

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "bitget": {
      "command": "npx",
      "args": ["-y", "bitget-mcp-server", "--modules", "all"],
      "env": {
        "BITGET_API_KEY": "your-api-key",
        "BITGET_SECRET_KEY": "your-secret-key",
        "BITGET_PASSPHRASE": "your-passphrase"
      }
    }
  }
}
```

</details>

### CLI Tool

```bash
# Install globally
npm install -g bitget-client

# Set credentials
export BITGET_API_KEY="your-api-key"
export BITGET_SECRET_KEY="your-secret-key"
export BITGET_PASSPHRASE="your-passphrase"

# Query public market data (no auth needed)
bgc spot spot_get_ticker --symbol BTCUSDT

# Query account balance
bgc account account_get_balance

# Pretty-print output
bgc spot spot_get_ticker --symbol BTCUSDT --pretty
```

---

## Modules

| Module | Tools | Default | Description |
|:-------|:-----:|:-------:|:------------|
| `spot` | 13 | ✅ | Spot market data, orders, fills |
| `futures` | 14 | ✅ | Futures market data, positions, leverage |
| `account` | 8 | ✅ | Balances, transfers, deposits, withdrawals |
| `margin` | 7 | — | Cross/isolated margin trading |
| `copytrading` | 5 | — | Copy trading with trader selection |
| `convert` | 3 | — | Real-time coin conversion |
| `earn` | 3 | — | Savings & staking |
| `p2p` | 2 | — | P2P merchant and order data |
| `broker` | 3 | — | Broker account management |

Default modules: `spot`, `futures`, `account` (34 tools — within Cursor's 40-tool limit).

Use `--modules all` to load all 58 tools.

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|:---------|:--------:|:------------|
| `BITGET_API_KEY` | ✳ | Bitget API key |
| `BITGET_SECRET_KEY` | ✳ | Bitget secret key |
| `BITGET_PASSPHRASE` | ✳ | Bitget API passphrase |
| `BITGET_API_BASE_URL` | No | Custom API base URL (default: `https://api.bitget.com`) |
| `BITGET_TIMEOUT_MS` | No | Request timeout in ms (default: `15000`) |

> ✳ Required for private (authenticated) endpoints. Public market data works without credentials.

### Read-Only Mode

Add `--read-only` to disable all write/trade operations — safe for monitoring and exploration:

```bash
npx -y bitget-mcp-server --modules all --read-only
bgc --read-only spot spot_get_ticker --symbol BTCUSDT
```

---

## Security

- Credentials are passed via **environment variables** — never hardcoded or logged
- **`--read-only` mode** enforced at server level — no write tools exposed at all
- All private requests signed with **HMAC-SHA256**
- **Client-side rate limiting** (token bucket) prevents API abuse
- Structured error responses never leak credentials or internal state

---

## Repository Structure

```
agent_hub/
├── packages/
│   ├── bitget-core/      # Shared library: REST client, tools, auth, rate limiting
│   ├── bitget-mcp/       # MCP server (bitget-mcp-server)
│   ├── bitget-client/    # CLI tool (bgc)
│   └── bitget-skill/     # Claude Code skill
├── docs/
│   ├── packages/         # Per-package documentation
│   ├── architecture.md   # System architecture
│   └── tools-reference.md
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Development

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8

### Setup

```bash
git clone https://github.com/your-org/agent_hub.git
cd agent_hub
pnpm install
pnpm -r build
```

### Build

```bash
pnpm -r build        # Build all packages
pnpm -r typecheck    # Type-check all packages
```

---

## License

[MIT](LICENSE)
