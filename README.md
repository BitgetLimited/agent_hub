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

---

**Bitget Agent Hub** connects AI assistants and automation tools to the [Bitget](https://www.bitget.com) exchange. Two integration modes, plus a built-in **Skill Hub** for market analysis:

- **MCP Server** — for Claude Code, Cursor, Codex, and any MCP-compatible AI
- **CLI (`bgc`) + Skill** — for shell-based AI agents (Claude Code skills, OpenClaw)

Once configured, your AI can check prices, query balances, place and cancel orders, manage futures positions, set leverage, and transfer funds — all through natural language.

---

## Installation

Use **`bitget-hub`** to install, upgrade, and manage all Bitget Agent Hub packages. No installation required — run directly via `npx`.

### Quick Start

```bash
# Install everything and deploy skills to Claude Code (default)
npx bitget-hub upgrade-all --target claude
```

This installs all three packages globally and deploys skills to Claude Code:

| Package | What it does |
|---------|-------------|
| [`bitget-client`](packages/bitget-client/) | CLI tool (`bgc`) — shell access to all Bitget tools |
| [`bitget-skill`](packages/bitget-skill/) | Trading skill — AI uses `bgc` as a live API bridge |
| [`bitget-skill-hub`](packages/bitget-skill-hub/) | 5 market-analysis skills (macro, sentiment, technical, news, on-chain) |

### Deploy Skills to AI Tools

Skills can be deployed to Claude Code, Codex, and OpenClaw:

```bash
# Deploy to a specific tool
npx bitget-hub install --target codex

# Deploy to multiple tools
npx bitget-hub install --target claude,codex

# Deploy to all supported tools
npx bitget-hub install --target all

# Deploy a single skill package
npx bitget-hub install bitget-skill --target claude
```

### Install or Upgrade Individual Packages

```bash
# Upgrade a single package
npx bitget-hub upgrade bitget-client

# Upgrade and deploy skills
npx bitget-hub upgrade bitget-skill --target claude

# Rollback to a specific version
npx bitget-hub rollback bitget-skill --to 1.0.0
```

### Interactive Mode

```bash
npx bitget-hub
```

Launches an interactive menu to upgrade, rollback, or install skills — no flags needed.

### Set Credentials

All integrations need a Bitget API key for private endpoints (account, trading). Public market data works without credentials.

1. Log in to [bitget.com](https://www.bitget.com) → **Settings → API Management**
2. Create a new API key — select **Read** and/or **Trade** permissions
3. Set environment variables:

```bash
export BITGET_API_KEY="your-api-key"
export BITGET_SECRET_KEY="your-secret-key"
export BITGET_PASSPHRASE="your-passphrase"
```

---

## MCP Server

Gives AI assistants direct access to Bitget tools via the [Model Context Protocol](https://modelcontextprotocol.io). No global install needed — runs via `npx`.

### Claude Code

```bash
claude mcp add -s user \
  --env BITGET_API_KEY=your-api-key \
  --env BITGET_SECRET_KEY=your-secret-key \
  --env BITGET_PASSPHRASE=your-passphrase \
  bitget \
  -- npx -y bitget-mcp-server
```

### Codex

Add to `~/.codex/config.toml`:

```toml
[[mcp_servers]]
name = "bitget"
command = "npx"
args = ["-y", "bitget-mcp-server"]

[mcp_servers.env]
BITGET_API_KEY = "your-api-key"
BITGET_SECRET_KEY = "your-secret-key"
BITGET_PASSPHRASE = "your-passphrase"
```

### OpenClaw

Add to your OpenClaw agent config:

```json
{
  "mcp_servers": {
    "bitget": {
      "command": "npx",
      "args": ["-y", "bitget-mcp-server"],
      "env": {
        "BITGET_API_KEY": "your-api-key",
        "BITGET_SECRET_KEY": "your-secret-key",
        "BITGET_PASSPHRASE": "your-passphrase"
      }
    }
  }
}
```

→ See [docs/packages/bitget-mcp.md](docs/packages/bitget-mcp.md) for more clients (Claude Desktop, Cursor, VS Code Copilot, Windsurf).

---

## CLI Tool (`bgc`)

A command-line interface for all Bitget tools. Outputs JSON — ideal for scripting and AI agent shell use.

```bash
# Market data (no credentials needed)
bgc spot spot_get_ticker --symbol BTCUSDT

# Account queries
bgc account get_account_assets

# Trading
bgc spot spot_place_order --orders '[{"symbol":"BTCUSDT","side":"buy","orderType":"limit","price":"95000","size":"0.01"}]'
```

---

## Skill Hub

5 market-analysis skills for Claude Code, Codex, and OpenClaw. Each skill instructs the AI how to use the market-data MCP server to deliver analyst-grade outputs.

| Skill | What it does |
|-------|-------------|
| [`macro-analyst`](packages/bitget-skill-hub/skills/macro-analyst/SKILL.md) | Macro & cross-asset analysis — Fed policy, yield curve, BTC vs DXY/Nasdaq/Gold |
| [`market-intel`](packages/bitget-skill-hub/skills/market-intel/SKILL.md) | On-chain & institutional intelligence — ETF flows, whale activity, DeFi TVL |
| [`news-briefing`](packages/bitget-skill-hub/skills/news-briefing/SKILL.md) | News aggregation & narrative synthesis — morning briefings, keyword search |
| [`sentiment-analyst`](packages/bitget-skill-hub/skills/sentiment-analyst/SKILL.md) | Sentiment & positioning — Fear & Greed, long/short ratios, funding rates |
| [`technical-analysis`](packages/bitget-skill-hub/skills/technical-analysis/SKILL.md) | Technical analysis — 23 indicators across 6 categories |

The `technical-analysis` skill requires Python: `pip install pandas numpy`

→ See [docs/skill-hub.md](docs/skill-hub.md) for full documentation.

---

## Modules

| Module | Tools | Loaded by default |
|--------|:-----:|:-----------------:|
| `spot` | 13 | ✅ |
| `futures` | 14 | ✅ |
| `account` | 8 | ✅ |
| `margin` | 7 | — |
| `copytrading` | 5 | — |
| `convert` | 3 | — |
| `earn` | 3 | — |
| `p2p` | 2 | — |
| `broker` | 3 | — |

Default: `spot + futures + account` = 36 tools (fits within Cursor's 40-tool limit).
Load everything: `--modules all`

---

## Security

- Credentials via **environment variables only** — never hardcoded or logged
- `--read-only` flag disables all write operations at server level
- All authenticated requests signed with **HMAC-SHA256**
- Client-side rate limiting prevents accidental API abuse
- Write operations (orders, transfers) require explicit confirmation before execution

---

## Development

```bash
# Prerequisites: Node.js ≥ 18, pnpm ≥ 8
pnpm install
pnpm -r build
pnpm -r test
```

---

## License

[MIT](LICENSE)
