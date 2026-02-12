<p align="center">
  <img src="https://s2.coinmarketcap.com/static/img/exchanges/64x64/710.png" alt="Bitget" width="64" />
</p>

<h1 align="center">Bitget MCP Server</h1>

<p align="center">
  <strong>Connect AI assistants to Bitget — trade, query, and manage your crypto portfolio through natural language.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/bitget-mcp-server"><img src="https://img.shields.io/npm/v/bitget-mcp-server.svg?style=flat-square&color=cb3837" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/bitget-mcp-server"><img src="https://img.shields.io/npm/dm/bitget-mcp-server.svg?style=flat-square&color=blue" alt="npm downloads" /></a>
  <a href="https://www.npmjs.com/package/bitget-mcp-server"><img src="https://img.shields.io/node/v/bitget-mcp-server.svg?style=flat-square&color=43853d" alt="node version" /></a>
  <a href="https://www.npmjs.com/package/bitget-mcp-server"><img src="https://img.shields.io/npm/l/bitget-mcp-server.svg?style=flat-square" alt="license" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-compatible-8A2BE2?style=flat-square" alt="MCP compatible" /></a>
  <a href="https://www.bitget.com"><img src="https://img.shields.io/badge/Exchange-Bitget-00b897?style=flat-square" alt="Bitget" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#available-modules">Modules</a> •
  <a href="#tool-highlights">Tools</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#security">Security</a>
</p>

---

## What is this?

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives AI assistants — **Cursor**, **Claude Desktop**, **Windsurf**, and others — direct access to the Bitget cryptocurrency exchange.

> **One config, 56+ tools.** Ask your AI to check prices, place trades, manage positions, and more.

---

## Features

| | Feature | Description |
|---|---------|-------------|
| **56+ tools** | Full API coverage | Spot, futures, margin, copy trading, convert, earn, P2P, broker |
| **Read-only mode** | `--read-only` flag | Disable all write/trade operations for safe exploration |
| **Module filtering** | `--modules` flag | Expose only the tools you need |
| **Smart detection** | Dynamic capabilities | Unavailable modules auto-hidden from AI tool lists |
| **Agent-first** | `system_get_capabilities` | Machine-readable capability discovery for agent planning |
| **Rate limiting** | Token bucket | Client-side rate limiting per endpoint prevents API abuse |
| **Auth** | HMAC-SHA256 | Industry-standard Bitget API authentication |
| **Structured errors** | Error codes + suggestions | Machine-parseable errors with actionable suggestions |

---

## Quick Start

### Prerequisites

- **Node.js** >= 18
- A [**Bitget API key**](https://www.bitget.com/account/newapi) with appropriate permissions

### Installation

Choose your AI client and copy the configuration:

<details>
<summary><strong>Cursor</strong></summary>

Add to `.cursor/mcp.json` in your project root:

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
<summary><strong>Claude Desktop</strong></summary>

Add to your config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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
<summary><strong>Claude Code</strong></summary>

Run in your terminal:

```bash
claude mcp add \
  --transport stdio \
  --env BITGET_API_KEY=your-api-key \
  --env BITGET_SECRET_KEY=your-secret-key \
  --env BITGET_PASSPHRASE=your-passphrase \
  bitget \
  -- npx -y bitget-mcp-server --modules all
```

Verify with `claude mcp list`.

</details>

<details>
<summary><strong>VS Code (Copilot)</strong></summary>

Add to `.vscode/mcp.json` in your project root:

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

Requires VS Code 1.102+ with Copilot.

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

<details>
<summary><strong>Other MCP Clients</strong></summary>

For any MCP-compatible client, the server can be started with:

```bash
BITGET_API_KEY=your-api-key \
BITGET_SECRET_KEY=your-secret-key \
BITGET_PASSPHRASE=your-passphrase \
npx -y bitget-mcp-server --modules all
```

The server communicates over **stdio** — pipe stdin/stdout to your MCP client.

</details>

### Read-Only Mode

Append `--read-only` to disable all write/trade operations:

```diff
- "args": ["-y", "bitget-mcp-server", "--modules", "all"],
+ "args": ["-y", "bitget-mcp-server", "--modules", "all", "--read-only"],
```

---

## Available Modules

| Module | Tools | Description |
|:-------|:-----:|:------------|
| `spot` | 13 | Spot market data + order placement & management |
| `futures` | 14 | Futures market data + trading + leverage + positions |
| `account` | 8 | Assets, transfers, withdrawals, deposits, sub-accounts |
| `margin` | 7 | Cross/isolated margin trading, borrow & repay |
| `copytrading` | 5 | Copy trading with auto trader selection |
| `convert` | 3 | Coin conversion with real-time quoted prices |
| `earn` | 3 | Savings & staking (auto-detected availability) |
| `p2p` | 2 | P2P merchant list and order history |
| `broker` | 3 | Broker account and API key management |

> **Default:** `spot`, `futures`, `account`. Use `--modules all` to enable everything.

---

## Tool Highlights

### Market Data *(no auth required)*

| Tool | Description |
|:-----|:------------|
| `spot_get_ticker` / `futures_get_ticker` | Real-time price and 24h stats |
| `spot_get_depth` / `futures_get_depth` | Live order book |
| `spot_get_candles` / `futures_get_candles` | K-line / candlestick data |
| `futures_get_funding_rate` | Current and historical funding rates |
| `futures_get_open_interest` | Open interest by symbol |

### Trading

| Tool | Description |
|:-----|:------------|
| `spot_place_order` / `futures_place_order` | Place single or batch orders |
| `spot_place_plan_order` | Trigger / stop-loss / take-profit orders |
| `futures_set_leverage` | Adjust leverage per symbol |
| `futures_get_positions` | View current open positions |

### Account & Transfers

| Tool | Description |
|:-----|:------------|
| `get_account_assets` | Balances across all account types |
| `transfer` | Internal transfers between spot, futures, funding |
| `get_deposit_address` | Generate deposit addresses |
| `withdraw` | On-chain withdrawals |

### Copy Trading

| Tool | Description |
|:-----|:------------|
| `copy_get_traders` | Browse available elite traders |
| `copy_place_order` | Follow a trader (auto-selects when `traderId` omitted) |

### Agent Utilities

| Tool | Description |
|:-----|:------------|
| `system_get_capabilities` | Full module availability snapshot for planning |

---

## Configuration

### CLI Options

```
bitget-mcp-server [options]

  --modules <list>     Comma-separated modules (default: spot,futures,account)
                       Use "all" to load all modules
  --read-only          Disable all write/trade operations
  --help               Show help
  --version            Show version
```

### Environment Variables

| Variable | Required | Description |
|:---------|:---------|:------------|
| `BITGET_API_KEY` | Yes * | Bitget API key |
| `BITGET_SECRET_KEY` | Yes * | Bitget secret key |
| `BITGET_PASSPHRASE` | Yes * | Bitget API passphrase |
| `BITGET_API_BASE_URL` | No | API base URL (default: `https://api.bitget.com`) |
| `BITGET_TIMEOUT_MS` | No | Request timeout in ms (default: `15000`) |

> \* Required for private endpoints. Public market data tools work without auth.

---

## Security

- API credentials are passed via **environment variables**, never hardcoded or logged
- **`--read-only` mode** prevents all write operations at the server level
- All private requests are signed with **HMAC-SHA256**
- **Client-side rate limiting** prevents accidental API abuse
- Structured error responses never leak credentials or internal state

---

## License

[MIT](./LICENSE)
