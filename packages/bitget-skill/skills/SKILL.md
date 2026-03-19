---
name: bitget
description: >
  Use this skill whenever the user wants to check prices, manage account balances,
  place or cancel orders, manage futures or spot positions, set leverage, transfer
  funds, check funding rates, use demo/paper trading, or do anything else on the
  Bitget exchange. Invoke this skill even when the user doesn't say "Bitget" by name
  — action phrases like "check my open orders", "cancel my BTC position", "move USDT
  to futures", "what's my P&L", "place a market sell", "how much can I withdraw",
  "show my positions", "set leverage to 10x", "what's the funding rate" all require
  this skill. Also invoke for Chinese-language trading requests such as "查看我的账户",
  "下一个限价单", "查看持仓盈亏", "转账到合约账户", "BTC现在多少钱" — these are Bitget
  operations even without the exchange name. Always invoke this skill before attempting
  any exchange trading task from scratch.
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

For trading interfaces, detailed reference docs with full parameter descriptions, use cases, and examples are in:
`~/.claude/skills/bitget-skill/references/trading/`

| File | Covers |
|------|--------|
| `trading/spot-place-order.md` | Spot limit/market/batch orders, TP/SL presets |
| `trading/spot-cancel-orders.md` | Cancel single, batch, or all spot orders |
| `trading/spot-modify-order.md` | Modify (cancel-and-replace) a spot order |
| `trading/spot-get-orders.md` | Query open/history spot orders |
| `trading/spot-plan-orders.md` | Spot trigger/plan orders (stop-loss, breakout) |
| `trading/futures-place-order.md` | Futures orders, one-way/hedge mode, TP/SL |
| `trading/futures-modify-order.md` | Modify pending futures order: adjust TP/SL, price, size |
| `trading/futures-cancel-orders.md` | Cancel futures orders |
| `trading/futures-get-orders.md` | Query futures orders and fills |
| `trading/futures-positions.md` | Current/history positions, PnL, liquidation price |
| `trading/futures-leverage-config.md` | Set leverage, margin mode, position mode |

**Always read the relevant trading reference before constructing a trading command.**

## Futures: Close Position & TP/SL Quick Rules

Before placing ANY futures close or TP/SL order, check the position first:
```bash
bgc futures futures_get_positions --productType USDT-FUTURES --symbol BTCUSDT
```
Note: `holdSide` (long/short) and `posMode` (one_way_mode/hedge_mode).

### Close direction rules (most common mistake)
| Position | `side` to close | Extra param |
|----------|----------------|-------------|
| Long (one-way mode) | `sell` | `reduceOnly: "YES"` |
| Short (one-way mode) | `buy` | `reduceOnly: "YES"` |
| Long (hedge mode) | `sell` | `tradeSide: "close"` |
| Short (hedge mode) | `buy` | `tradeSide: "close"` |

> **Selling to close a short is WRONG — it opens more short.**

### TP/SL options
1. **Preset at entry**: `presetStopSurplusPrice` / `presetStopLossPrice` on the opening order
2. **Add/modify after entry**: `futures_modify_order` with `newPresetStopSurplusPrice` / `newPresetStopLossPrice` — does NOT cancel the order; pass `"0"` to delete a preset
3. **Manual limit + reduceOnly**: place a separate limit close order at target price (use as fallback)

Read `trading/futures-modify-order.md` before using `futures_modify_order`.

## Module quick-reference

| Module | Use for |
|--------|---------|
| `spot` | Spot prices, orderbook, candles, spot orders |
| `futures` | Perpetuals prices, positions, futures orders, leverage |
| `account` | Balances, deposits, withdrawals, transfers, subaccounts |
| `margin` | Margin assets, borrow/repay, margin orders |
| `copytrading` | Follow traders, copy positions. **Note:** Copy positions are separate from regular futures — use `copy_get_positions` and `copy_close_position`, NOT `futures_place_order`, to manage them |
| `convert` | Convert one coin to another. **Two-step flow required:** call `convert_get_quote` first (returns a quote ID + rate, valid ~10s), then `convert_execute`. Always show the quoted rate to user before executing |
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

**Withdrawal safety:** Always show the chain name and destination address in the confirmation prompt. Wrong chain selection is irreversible — if the user hasn't specified a chain, list available chains and ask them to confirm before proceeding.

**Market buy size:** For spot market buys, `size` is in quote coin (USDT), not base coin. Confirm the user's intent before constructing market buy orders to avoid near-zero silent executes.

## Handling errors

If `bgc` returns `"ok": false`, read `error.suggestion` for the recovery action.
Common fixes: `~/.claude/skills/bitget-skill/references/error-codes.md`

When credentials are missing (`AUTH_MISSING`), show the user exactly which env vars to set.

## Output presentation

- For prices/tickers: show symbol, last price, 24h change, volume in a readable summary
- For order lists: table format with orderId, symbol, side, price, size, status
- For balances: list coins with available and frozen amounts; skip dust balances (< 0.0001)
- For futures positions: always show symbol, side (long/short), size, entry price, mark price, unrealized PnL, **liquidation price**, and leverage. Never omit liquidation price
- For funding rates: show current rate, annualized rate, and next settlement time
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

## Demo Trading Mode

Use demo mode when the user wants to practice trading, test strategies, or explicitly asks for "demo", "paper trading", or "simulated trading".

**Setup:** The user needs a Bitget Demo API Key. See `~/.claude/skills/bitget-skill/references/demo-trading.md` for full setup steps.

**For bgc CLI:** Add `--paper-trading` as the FIRST flag after `bgc`:
```bash
bgc --paper-trading spot spot_get_ticker --symbol BTCUSDT
bgc --paper-trading futures futures_get_positions --productType USDT-FUTURES
bgc --paper-trading account get_account_assets
```

**For MCP tools:** The MCP server must be started with `--paper-trading`. If the user is asking to use demo mode via MCP but the server wasn't started with that flag, inform them they need to restart with `--paper-trading`.

**Key rule:** In demo mode, add `--paper-trading` to EVERY bgc command in the session. Never mix demo and live commands in the same session.
