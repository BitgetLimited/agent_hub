# Getting Started

This guide walks you through installing and configuring any Bitget Agent Hub package.

## Choose Your Integration

| I want to… | Use |
|---|---|
| Connect Claude Desktop / Cursor / Copilot to Bitget | [`bitget-agent-mcp`](https://github.com/Bitget-AI/agent-mcp) |
| Query Bitget from the terminal or scripts | [`bitget-agent-cli` (`bgc`)](https://github.com/Bitget-AI/agent-cli) |
| Let Claude Code call Bitget APIs autonomously | [`bitget-agent-skill`](https://github.com/Bitget-AI/agent-skill) |
| Build my own Bitget integration in TypeScript | [`bitget-agent-sdk`](https://github.com/Bitget-AI/agent-sdk) |

---

## Prerequisites

- **Node.js** ≥ 20
- A [**Bitget API key**](https://www.bitget.com/account/newapi) (optional for public market data)

## Get API Credentials

1. Log in to [bitget.com](https://www.bitget.com)
2. Go to **Settings → API Management**
3. Create a new API key
4. Select permissions:
   - **Read Only** — for market data and account queries
   - **Trade** — for placing and cancelling orders
   - **Withdraw** — only if you need withdrawal tools
5. Note your **API Key**, **Secret Key**, and **Passphrase**

> Tip: create a **Demo API Key** and run with `--paper-trading` to rehearse against Bitget's Demo Trading environment before touching real funds.

## Set Environment Variables

All packages read credentials from environment variables:

```bash
export BITGET_API_KEY="your-api-key"
export BITGET_SECRET_KEY="your-secret-key"
export BITGET_PASSPHRASE="your-passphrase"
```

Or pass them inline:

```bash
BITGET_API_KEY=xxx BITGET_SECRET_KEY=yyy BITGET_PASSPHRASE=zzz bgc account_overview
```

## Verify Without Credentials

Public market data works without any credentials:

```bash
# MCP Server — starts without env vars, exposes public tools
npx -y @bitget-ai/bitget-agent-mcp

# CLI — no auth needed for market data
npx @bitget-ai/bitget-agent-cli market --action tickers --category SPOT --symbol BTCUSDT
```

## Next Steps

- [Configure the MCP server](https://github.com/Bitget-AI/agent-mcp)
- [Use the `bgc` CLI](https://github.com/Bitget-AI/agent-cli)
- [Set up the Claude Code skill](https://github.com/Bitget-AI/agent-skill)
- [Understand the ecosystem architecture](architecture.md)
