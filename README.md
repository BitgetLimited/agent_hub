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

**Bitget Agent Hub** connects AI assistants and automation tools to the [Bitget](https://www.bitget.com) exchange. Two integration modes for Bitget, plus a built-in **Skill Hub** — a collection of market-analysis skills for macro, on-chain intelligence, news briefing, sentiment, and technical analysis.

- **MCP Server** — for Claude Code, Cursor, Codex, and any MCP-compatible AI
- **CLI (`bgc`) + Skill** — for shell-based AI agents (Claude Code skills, OpenClaw)

Once configured, your AI can check prices, query balances, place and cancel orders, manage futures positions, set leverage, and transfer funds — all through natural language.

---

## Packages

| Package | What it does | Install |
|---------|-------------|---------|
| [`bitget-mcp-server`](packages/bitget-mcp/) | MCP server — integrates with Claude, Cursor, Codex | `npx -y bitget-mcp-server` |
| [`bitget-client`](packages/bitget-client/) | CLI tool (`bgc`) — shell access to all 36 tools | `npm install -g bitget-client` |
| [`bitget-skill`](packages/bitget-skill/) | Claude Code skill — AI uses `bgc` as a live API bridge | `npm install -g bitget-skill` |
| [`bitget-indicator-skill`](packages/bitget-indicator-skill/) | Technical indicator skill — 23 crypto indicators, 6 categories | `npm install -g bitget-indicator-skill` |
| [`bitget-core`](packages/bitget-core/) | Shared REST client and tool definitions | internal |

---

## Skill Hub

A built-in collection of market-analysis skills for Claude Code. Each skill instructs the AI how to use the market-data MCP server to deliver analyst-grade outputs.

| Skill | What it does |
|-------|-------------|
| [`macro-analyst`](skill_hub/macro-analyst/SKILL.md) | Macro & cross-asset analysis — Fed policy, yield curve, CPI, BTC vs DXY/Nasdaq/Gold correlation, RISK-ON/OFF verdict |
| [`market-intel`](skill_hub/market-intel/SKILL.md) | On-chain & institutional intelligence — ETF flows, whale activity, exchange flows, market cycle indicators (AHR999, Pi Cycle, Rainbow Chart), DeFi TVL |
| [`news-briefing`](skill_hub/news-briefing/SKILL.md) | News aggregation & narrative synthesis — morning briefings, keyword search, Chinese social media pulse, KOL views |
| [`sentiment-analyst`](skill_hub/sentiment-analyst/SKILL.md) | Sentiment & positioning analysis — Fear & Greed index, long/short ratios, funding rates, open interest, taker ratio |
| [`technical-analyst`](skill_hub/technical-analyst/SKILL.md) | Technical analysis & backtesting — RSI, MACD, Bollinger Bands, support/resistance, strategy backtests vs buy-and-hold |

→ See [docs/skill-hub.md](docs/skill-hub.md) for full documentation.

### Required: Market Data MCP Server

All Skill Hub skills depend on the **market-data MCP server** (HTTP). No API key required — the server provides public market data.

#### Claude Code

```bash
claude mcp add -s user \
  market-data \
  --transport http \
  -- https://datahub.noxiaohao.com/mcp
```

#### Codex

Add to `~/.codex/config.toml` (or the project-level `codex.toml`):

```toml
[[mcp_servers]]
name = "market-data"
type = "http"
url = "https://datahub.noxiaohao.com/mcp"
```

#### OpenClaw

Add to your OpenClaw agent config:

```json
{
  "mcp_servers": {
    "market-data": {
      "transport": "http",
      "url": "https://datahub.noxiaohao.com/mcp"
    }
  }
}
```

---


## Get API Credentials

All integrations need a Bitget API key for private endpoints (account, trading). Public market data works without credentials.

1. Log in to [bitget.com](https://www.bitget.com) → **Settings → API Management**
2. Create a new API key — select **Read** and/or **Trade** permissions
3. Save your **API Key**, **Secret Key**, and **Passphrase**

---

## MCP Server

Gives AI assistants direct access to 36 Bitget tools via the [Model Context Protocol](https://modelcontextprotocol.io).

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

Add to `~/.codex/config.toml` (or the project-level `codex.toml`):

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

OpenClaw invokes MCP servers via its tool gateway. Add to your OpenClaw agent config:

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

### Other clients (Claude Desktop, Cursor, VS Code Copilot, Windsurf)

→ See [docs/packages/bitget-mcp.md](docs/packages/bitget-mcp.md) for per-client config snippets.

---

## CLI Tool (`bgc`)

A command-line interface for all 36 Bitget tools. Outputs JSON — ideal for scripting and AI agent shell use.

```bash
npm install -g bitget-client

export BITGET_API_KEY="your-api-key"
export BITGET_SECRET_KEY="your-secret-key"
export BITGET_PASSPHRASE="your-passphrase"

# Market data (no credentials needed)
bgc spot spot_get_ticker --symbol BTCUSDT
bgc futures futures_get_funding_rate --productType USDT-FUTURES --symbol BTCUSDT

# Account queries
bgc account get_account_assets
bgc futures futures_get_positions --productType USDT-FUTURES

# Trading (shows confirmation prompt first)
bgc spot spot_place_order --orders '[{"symbol":"BTCUSDT","side":"buy","orderType":"limit","price":"95000","size":"0.01"}]'
```

---

## Claude Code Skill

The skill lets Claude Code autonomously call Bitget APIs by running `bgc` commands via the Bash tool — no server process required.

```bash
# 1. Install bgc
npm install -g bitget-client

# 2. Install skill (auto-copies to ~/.claude/skills/bitget-skill/)
npm install -g bitget-skill

# 3. Set credentials in your shell environment
export BITGET_API_KEY="your-api-key"
export BITGET_SECRET_KEY="your-secret-key"
export BITGET_PASSPHRASE="your-passphrase"
```

After installation, Claude Code picks up the skill automatically. Try: *"查一下我的 BTC 仓位"* or *"What's the current BTC price?"*

→ See [docs/packages/bitget-skill.md](docs/packages/bitget-skill.md) for details.

---

## Technical Indicator Skill

23 crypto technical indicators across 6 categories (Trend, Volatility, Oscillator, Volume, Momentum, Support/Resistance). Each indicator outputs recent time-series data, giving AI full visibility into trend evolution for richer, more accurate analysis. No API key required for public market data.

```bash
# 1. Install skill (auto-copies to ~/.claude/skills/bitget-indicator-skill/)
npm install -g bitget-indicator-skill

# 2. Ensure Python dependencies are installed
pip install pandas numpy
```

After installation, try: *"BTC 1-hour technical analysis"* or *"Is ETH overbought right now?"*

→ See [packages/bitget-indicator-skill/](packages/bitget-indicator-skill/) for details.

---

## OpenClaw Automation

For OpenClaw webhook-triggered automation, use the `bgc` CLI directly in your action scripts:

```bash
#!/bin/bash
# Example: alert action that checks balance when triggered
bgc account get_account_assets | jq '.data.data[] | select(.coin == "USDT")'
```

Or use the MCP integration above to give your OpenClaw AI agent full Bitget tool access.

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
