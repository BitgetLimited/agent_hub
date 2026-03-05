---
name: bitget
description: >
  Use this skill whenever the user wants to interact with the Bitget cryptocurrency
  exchange — including checking prices, viewing account balances, placing or cancelling
  orders, managing futures positions, setting leverage, transferring funds, checking
  funding rates, browsing earn products, or anything else involving Bitget trading data
  or account operations. This applies even when the user doesn't say "Bitget" explicitly
  — phrases like "check my balance", "what's the BTC price", "place a limit order",
  "show my open positions", "set leverage to 10x", "how much USDT do I have" all
  point to this skill. Always invoke this skill before attempting any Bitget-related
  task from scratch.
---

# Bitget Skill

You have access to the full Bitget exchange via the `bgc` CLI tool — spot, futures,
account, margin, copy-trading, convert, earn, P2P, and broker operations.

## Step 1: Check prerequisites

```bash
bgc --version
```

If not found → tell the user: `npm install -g bitget-client`

For private endpoints (account info, trading, transfers): credentials must be set.
See `~/.claude/skills/bitget-skill/references/auth-setup.md`.

## Step 2: Run the command

```bash
bgc <module> <tool_name> [--param value ...]
```

All output is JSON. The response always has:
- `data` — the actual result
- `endpoint` — which API was called
- `requestTime` — request timestamp

For the full list of tools and parameters, read:
`~/.claude/skills/bitget-skill/references/commands.md`

It has a table of contents — go directly to the relevant module section.

## Module quick-reference

| Module | Use for |
|--------|---------|
| `spot` | Spot prices, orderbook, candles, spot orders |
| `futures` | Perpetuals prices, positions, futures orders, leverage |
| `account` | Balances, deposits, withdrawals, transfers, subaccounts |
| `margin` | Margin assets, borrow/repay, margin orders |
| `copytrading` | Follow traders, copy positions |
| `convert` | Convert one coin to another |
| `earn` | Savings/staking products, subscribe/redeem |
| `p2p` | P2P merchants and orders |
| `broker` | Broker subaccounts and API keys |

## Write operations: always confirm first

Before running any command marked **Write operation: Yes**, summarize what it will do
and ask the user to confirm. This includes: placing orders, cancelling orders, transfers,
withdrawals, setting leverage, borrowing, redeeming earn products.

Example confirmation:
> "This will place a limit buy order for 0.01 BTC at $70,000 on BTCUSDT. Confirm?"

Never silently execute a write operation.

## Handling errors

If `bgc` returns `"ok": false`, read `error.suggestion` for the recovery action.
Common fixes: `~/.claude/skills/bitget-skill/references/error-codes.md`

When credentials are missing (`AUTH_MISSING`), show the user exactly which env vars to set.

## Output presentation

- For prices/tickers: show symbol, last price, 24h change, volume in a readable summary
- For order lists: table format with orderId, symbol, side, price, size, status
- For balances: list coins with available and frozen amounts; skip zero balances
- For raw data the user didn't ask to see: summarize, don't dump the full JSON

## Usage examples

```bash
# Public market data (no credentials needed)
bgc spot spot_get_ticker --symbol BTCUSDT
bgc futures futures_get_ticker --productType USDT-FUTURES --symbol BTCUSDT
bgc futures futures_get_funding_rate --productType USDT-FUTURES --symbol BTCUSDT

# Account queries (requires credentials)
bgc account get_account_assets
bgc spot spot_get_orders --status open
bgc futures futures_get_positions --productType USDT-FUTURES

# Write operations (confirm before running)
bgc spot spot_place_order --orders '[{"symbol":"BTCUSDT","side":"buy","orderType":"limit","price":"70000","size":"0.01"}]'
bgc futures futures_set_leverage --productType USDT-FUTURES --symbol BTCUSDT --marginCoin USDT --leverage 10
bgc account transfer --fromAccountType spot --toAccountType futures_usdt --coin USDT --amount 100
```
