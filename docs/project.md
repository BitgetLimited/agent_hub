# Project

## Purpose

**Bitget Agent Hub** — connect AI assistants to the Bitget crypto exchange. One shared core library defines every Bitget API capability as a typed tool; multiple consumers expose those tools to different AI runtimes (MCP, CLI, skills).

## Business domain

Crypto exchange (Bitget) trading and account management via Bitget REST API V2: spot, futures/contracts, margin, copy-trading, convert (flash swap), earn (savings/staking), P2P, broker, and account/wallet operations.

## Target users

- Users of AI coding assistants / agents (Claude Code, Cursor, VS Code Copilot, Codex, Windsurf, ChatGPT, OpenClaw) who hold a Bitget account.
- Shell-based agents that prefer a CLI with JSON output.

## Main features

- Natural-language driven market queries, order placement, position/leverage management, transfers, funding-rate lookups.
- **Module filtering** — load only the modules you need (default `spot,futures,account` = 36 tools, under Cursor's 40-tool cap; `--modules all` = all 59).
- **Read-only mode** (`--read-only`) — drops every mutating tool (no orders, transfers, withdrawals).
- **Paper/demo trading** — `paptrading: 1` header against Bitget Demo environment.
- Works with no API key for public market data; private endpoints require credentials.

## Module catalogue

| Module ID    | Domain              | Tools | Default | Needs API key |
|--------------|---------------------|-------|---------|---------------|
| `spot`       | Spot market + trade | 13    | Yes     | Trade only    |
| `futures`    | Contract market+trade| 15   | Yes     | Trade only    |
| `account`    | Account & wallet    | 8     | Yes     | Yes           |
| `margin`     | Margin trading      | 7     | No      | Yes           |
| `copytrading`| Copy trading        | 5     | No      | Yes           |
| `convert`    | Flash swap          | 3     | No      | Yes           |
| `earn`       | Savings / staking   | 3     | No      | Yes (probed)  |
| `p2p`        | P2P                 | 2     | No      | Yes           |
| `broker`     | Broker / subaccounts| 3     | No      | Yes           |

Total: **59 tools**. `earn` is capability-probed at runtime and hidden when the account/region doesn't support it.

## Core workflows

- **Query** — ticker, orderbook, candles, funding rate, balances, positions, orders, fills.
- **Trade (write)** — place/cancel/modify spot, futures, margin orders (single + batch auto-routed by array length).
- **Move funds (write)** — transfer between accounts, withdraw, borrow/repay margin, subscribe/redeem earn.
- **Plan** — `system_get_capabilities` (MCP) returns machine-readable module availability for agent planning.

## Consumers (packages)

- **bitget-mcp-server** — MCP server over stdio (`npx bitget-mcp-server`).
- **bitget-client** — `bgc` CLI, JSON output, for shell agents.
- **bitget-skill** / **bitget-skill-hub** — Claude Code / Codex / OpenClaw skills; references auto-generated from core tool specs.
- **bitget-hub** — standalone installer CLI (`npx bitget-hub`) that installs/upgrades/rolls back the published packages.

## External integrations

- **Bitget REST API V2** (`https://api.bitget.com`) — the only external runtime dependency of the data path.
- **@modelcontextprotocol/sdk** — MCP protocol for the server consumer.

## Deployment / distribution

- Published as npm packages; launched via `npx` (no install). Node ≥ 18, pnpm ≥ 8 for development.
- Demo trading uses the same code path with `--paper-trading` and Demo API credentials.
