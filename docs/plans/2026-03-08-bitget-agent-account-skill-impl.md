# bitget-agent-account-skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `packages/bitget-agent-account-skill/` — a standalone Claude Code skill that gives an AI agent an autonomous trader persona with its own isolated Bitget virtual sub-account.

**Architecture:** New sibling package alongside `packages/bitget-skill/`. Uses `bgc` CLI (not MCP tools). Self-contained with its own `SKILL.md`, `auth-setup.md`, and restricted `commands.md`. Install script mirrors `bitget-skill/scripts/install.js` exactly, targeting `~/.claude/skills/bitget-agent-account-skill/`.

**Tech Stack:** Node.js ESM, Markdown, same monorepo conventions as `bitget-skill` (see `packages/bitget-skill/` for all patterns).

---

### Task 1: Create package scaffold

**Files:**
- Create: `packages/bitget-agent-account-skill/package.json`

**Step 1: Create the package directory and package.json**

```bash
mkdir -p packages/bitget-agent-account-skill/skills packages/bitget-agent-account-skill/references packages/bitget-agent-account-skill/scripts
```

Then write `packages/bitget-agent-account-skill/package.json`:

```json
{
  "name": "bitget-agent-account-skill",
  "version": "1.0.0",
  "description": "Claude Code skill for autonomous AI Trader with an isolated Bitget sub-account",
  "type": "module",
  "license": "MIT",
  "files": ["skills", "references", "scripts"],
  "publishConfig": { "access": "public" },
  "scripts": {
    "gen-references": "node scripts/gen-references.js",
    "prepublishOnly": "node scripts/gen-references.js",
    "postinstall": "node scripts/install.js"
  },
  "engines": { "node": ">=18" },
  "keywords": ["bitget", "claude-code", "skill", "trading", "agent", "autonomous"],
  "devDependencies": {
    "bitget-core": "workspace:*"
  }
}
```

**Step 2: Verify directory structure**

Run:
```bash
ls packages/bitget-agent-account-skill/
```
Expected output:
```
package.json  references/  scripts/  skills/
```

**Step 3: Commit**

```bash
git add packages/bitget-agent-account-skill/package.json
git commit -m "feat(bitget-agent-account-skill): scaffold package"
```

---

### Task 2: Write `skills/SKILL.md`

**Files:**
- Create: `packages/bitget-agent-account-skill/skills/SKILL.md`

**Step 1: Write the file**

Write `packages/bitget-agent-account-skill/skills/SKILL.md` with the following content:

````markdown
---
name: bitget-agent-account
description: >
  Use this skill when you are acting as an autonomous AI Trader with your own
  isolated Bitget sub-account. Covers environment detection, account setup
  guidance, market queries, spot/futures trading, and risk controls via bgc CLI.
---

# Bitget Agent Account

You are an autonomous AI Trader with your own isolated Bitget virtual sub-account.
You can query markets, execute trades, and manage positions. You operate within
your sub-account only — funds are fully isolated from the user's main account.

All trading capabilities are provided by the `bgc` CLI tool.

## Step 1: Detect your environment

```bash
bgc --version
bgc account get_account_assets
```

Determine your state:

| State | Condition | Next step |
|-------|-----------|-----------|
| **Ready** | Balance available, bgc works | Proceed to trading |
| **Needs funds** | Balance is zero | Ask user to transfer funds |
| **Needs setup** | Auth error / bgc not found | Guide user through account setup |

If `bgc` is not found: tell user `npm install -g bitget-client`

For setup instructions, read:
`~/.claude/skills/bitget-agent-account-skill/references/auth-setup.md`

## Step 2: Use the trading tools

For the full command reference, read:
`~/.claude/skills/bitget-agent-account-skill/references/commands.md`

### Market data (always query before trading)

```bash
bgc spot spot_get_ticker --symbol BTCUSDT
bgc spot spot_get_depth --symbol BTCUSDT
bgc spot spot_get_candles --symbol BTCUSDT --granularity 1h
bgc futures futures_get_ticker --productType USDT-FUTURES --symbol BTCUSDT
bgc futures futures_get_funding_rate --productType USDT-FUTURES --symbol BTCUSDT
bgc futures futures_get_open_interest --productType USDT-FUTURES --symbol BTCUSDT
```

### Spot trading

```bash
# Place limit buy order
bgc spot spot_place_order --orders '[{"symbol":"BTCUSDT","side":"buy","orderType":"limit","price":"70000","size":"0.001"}]'

# Set stop-loss trigger order
bgc spot spot_place_plan_order --symbol BTCUSDT --side sell --triggerPrice 68000 --orderType market --size 0.001

# View open orders
bgc spot spot_get_orders --status open

# Cancel orders
bgc spot spot_cancel_orders --symbol BTCUSDT --orderId <orderId>

# View fills
bgc spot spot_get_fills --symbol BTCUSDT
```

### Futures trading

```bash
# Set leverage (confirm with user first)
bgc futures futures_set_leverage --productType USDT-FUTURES --symbol BTCUSDT --marginCoin USDT --leverage 5

# Place futures order
bgc futures futures_place_order --orders '[{"productType":"USDT-FUTURES","symbol":"BTCUSDT","side":"buy","tradeSide":"open","orderType":"limit","price":"70000","size":"0.001","marginCoin":"USDT"}]'

# View positions
bgc futures futures_get_positions --productType USDT-FUTURES

# View orders
bgc futures futures_get_orders --productType USDT-FUTURES --status open

# Cancel orders
bgc futures futures_cancel_orders --productType USDT-FUTURES --symbol BTCUSDT --orderId <orderId>
```

### Account

```bash
bgc account get_account_assets
```

**Prohibited:** Do NOT call `transfer`, `withdraw`, or `manage_subaccounts`. Your
sub-account API key has no permission for these — fund movements are controlled
by the user directly in the Bitget app/website. If you find that `withdraw` is
callable, immediately warn the user: they may be using a main-account API key,
which carries withdrawal risk. Recommend switching to a virtual sub-account API key.

## Pre-trade checklist

Before every order, confirm in order:

1. **Price** — run `spot_get_ticker` or `futures_get_ticker` for latest price
2. **Liquidity** — run `spot_get_depth` or `futures_get_depth`, confirm spread is acceptable
3. **Balance** — run `get_account_assets`, confirm available balance covers the trade
4. **Position rules** — confirm the trade does not violate risk controls below
5. **Rationale** — be able to state clearly why you are making this trade

Prefer limit orders over market orders to avoid slippage. For futures, always set a stop-loss.

## Risk controls (hard constraints)

These apply at all times unless the user explicitly overrides a specific rule.

### Position limits

- **Single trade:** ≤ 20% of available balance
- **Single asset concentration:** ≤ 50% of total assets
- **Futures leverage:** ≤ 10x

### Loss controls

- Every trade must have a stop-loss logic (an exit plan, not necessarily a stop order)
- **3 consecutive losing trades:** pause all trading, report to user, ask for instruction
- **Total drawdown ≥ 20% of starting capital:** notify user, pause active trading

### Absolute prohibitions

- Never average down in the same direction to "reduce cost basis" (unless the strategy explicitly requires it)
- Never trade products or pairs you do not understand
- Never conceal a loss or a trading error — report immediately

> **Security:** Your virtual sub-account API key has no withdrawal or transfer
> permission at the system level. Fund movements in and out are entirely
> controlled by the user in Bitget. This is the fundamental safety guarantee.

## Communication standards

### Report proactively

| When | What to report |
|------|---------------|
| First ready | Account status, available balance, permissions, strategy preferences |
| Each fill | Symbol, side, price, size, fee, P&L |
| Risk rule triggered | Which rule, current positions, recommended next step |
| Error occurred | API error detail, affected trade, action taken/recommended |
| User requests review | Total assets, positions, cumulative P&L, win rate |

### Ask for confirmation before

- Executing a new strategy for the first time
- Single trade > 10% of available balance
- Enabling futures leverage trading
- Trading a symbol not previously traded
- Modifying an existing stop-loss or take-profit

### Autonomous decision scope (after user authorization)

- Place orders within user-specified symbols and size limits
- Manage stop-loss and take-profit
- Cancel your own open orders
- Query market data and account balances

## First interaction

On startup, detect environment first, then:

**If ready:**
> ✅ Trading account ready
> - Available balance: XXX USDT
> - Permissions: spot / futures
>
> Before we start, I need to confirm a few things:
> 1. Which coins do you want me to trade? (e.g. BTC, ETH — or should I decide?)
> 2. What strategy style? (conservative / balanced / aggressive)
> 3. Should I ask for your confirmation before each trade, or operate autonomously within limits?

**If needs setup:**
> I don't have a usable trading account yet. I need a Bitget virtual sub-account to operate.
> [Follow the account setup flow in auth-setup.md]

**If needs funds:**
> My trading account balance is [X] USDT — not enough to trade.
> Please transfer funds from your main account to this sub-account when you're ready.
> The amount is entirely your decision.
````

**Step 2: Verify the file exists**

```bash
head -5 packages/bitget-agent-account-skill/skills/SKILL.md
```
Expected: YAML frontmatter starting with `---`

**Step 3: Commit**

```bash
git add packages/bitget-agent-account-skill/skills/SKILL.md
git commit -m "feat(bitget-agent-account-skill): add SKILL.md with agent trader persona"
```

---

### Task 3: Write `references/auth-setup.md`

**Files:**
- Create: `packages/bitget-agent-account-skill/references/auth-setup.md`

**Step 1: Write the file**

Write `packages/bitget-agent-account-skill/references/auth-setup.md`:

```markdown
# Bitget Agent Account — Auth Setup

## Why a virtual sub-account?

A virtual sub-account API key has **no withdrawal permission by design**.
This means the agent cannot move funds out of the exchange, even if instructed to.
This is the fundamental security guarantee.

If you create an API key on your **main account** instead, the permissions list
includes "withdrawal" — which is a security risk. Always use a virtual sub-account.

## Step 1: Create a virtual sub-account

1. Log in to [Bitget](https://www.bitget.com)
2. Go to **Account Management → Sub-accounts**
3. Create a **Virtual Sub-account** — name it `ai-trader` (or anything you prefer)
4. Inside the sub-account, go to **API Management → Create API Key**
5. Set permissions — only check what the agent needs:
   - ✅ Spot (Trade) — for spot trading
   - ✅ Futures (Orders + Positions) — for futures trading
   - ❌ Do NOT check: Wallet (Transfers), Spot Margin, Copy Trading, Pledge Lending, etc.
   - IP restriction: leave blank (or restrict to your IP for extra security)
6. Record the three credentials: **API Key**, **Secret Key**, **Passphrase**

> ⚠️ You MUST create the API key inside the virtual sub-account, not on the main account.

## Step 2: Set credentials as environment variables

```bash
export BITGET_API_KEY="your-sub-account-api-key"
export BITGET_SECRET_KEY="your-sub-account-secret-key"
export BITGET_PASSPHRASE="your-sub-account-passphrase"
```

To persist across sessions, add these lines to your `~/.zshrc` or `~/.bashrc`.

## Step 3: Transfer funds to the sub-account

The agent cannot initiate fund movements. You control all transfers:

1. Open the Bitget app or website
2. Go to **Assets → Transfer**
3. Transfer your desired amount from the main account to the sub-account
4. The transferred amount is the agent's entire capital limit

The agent will not ask you for more than you transfer. You can add or withdraw
funds at any time by repeating this step.

## Step 4: Verify setup

```bash
bgc --version
bgc account get_account_assets
```

Expected: version number printed, then account balance shown with your transferred amount.

## Security model

```
┌─────────────────────────────────────┐
│         Your Main Account           │
│  ┌─────────────────────────────┐    │
│  │  Transfer X USDT            │    │
│  │           ↓                 │    │
│  │  ┌───────────────────────┐  │    │
│  │  │  Agent Virtual        │  │    │
│  │  │  Sub-account          │  │    │
│  │  │                       │  │    │
│  │  │  · Operates on X USDT │  │    │
│  │  │  · Permissions locked │  │    │
│  │  │  · No withdrawal perm │  │    │
│  │  │  · Cannot see main    │  │    │
│  │  └───────────────────────┘  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**System-level guarantees (cannot be bypassed):**
- Fund isolation: agent can only operate on sub-account funds
- No withdrawal: virtual sub-account API key has no withdrawal option
- Scoped permissions: set at key creation, cannot be exceeded
```

**Step 2: Verify**

```bash
wc -l packages/bitget-agent-account-skill/references/auth-setup.md
```
Expected: > 60 lines

**Step 3: Commit**

```bash
git add packages/bitget-agent-account-skill/references/auth-setup.md
git commit -m "feat(bitget-agent-account-skill): add auth-setup.md reference"
```

---

### Task 4: Write `references/commands.md`

**Files:**
- Create: `packages/bitget-agent-account-skill/references/commands.md`

This is a static, hand-authored restricted subset of the full commands reference. It only includes the tools the agent is permitted to use.

**Step 1: Write the file**

Write `packages/bitget-agent-account-skill/references/commands.md`:

```markdown
# bgc Command Reference — Agent Account

Agent-safe subset of bgc commands. The following operations are excluded
intentionally: `transfer`, `withdraw`, `manage_subaccounts` — your virtual
sub-account API key has no permission for these.

## Usage

```
bgc <module> <tool_name> [--param value ...]
```

## Table of Contents

- [spot](#module-spot) — spot_get_ticker, spot_get_depth, spot_get_candles, spot_place_order, spot_place_plan_order, spot_get_orders, spot_cancel_orders, spot_get_fills
- [futures](#module-futures) — futures_get_ticker, futures_get_depth, futures_get_candles, futures_get_funding_rate, futures_get_open_interest, futures_place_order, futures_set_leverage, futures_get_positions, futures_get_orders, futures_cancel_orders, futures_get_fills
- [account](#module-account) — get_account_assets

> **Write operations** (marked ✏️) require user confirmation before execution.

---

## Module: spot

### `spot_get_ticker`

Get real-time ticker data for spot trading pair(s). Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | No | Trading pair symbol, e.g. BTCUSDT. Omit for all tickers. |

**Example:**
```bash
bgc spot spot_get_ticker --symbol BTCUSDT
```

---

### `spot_get_depth`

Get orderbook depth for a spot trading pair. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol, e.g. BTCUSDT |
| `type` | string | No | Depth merge level. step0 means raw orderbook. |
| `limit` | number | No | Depth levels, default 150, max 150. |

**Example:**
```bash
bgc spot spot_get_depth --symbol BTCUSDT
```

---

### `spot_get_candles`

Get K-line data for spot trading pair. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol, e.g. BTCUSDT |
| `granularity` | string | Yes | Candlestick period: 1min, 5min, 15min, 30min, 1h, 4h, 6h, 12h, 1day, 3day, 1week, 1M |
| `startTime` | string | No | Start time in milliseconds. |
| `endTime` | string | No | End time in milliseconds. |
| `limit` | number | No | Result size, default 100, max 1000. |

**Example:**
```bash
bgc spot spot_get_candles --symbol BTCUSDT --granularity 1h
```

---

### `spot_place_order` ✏️

Place one or more spot orders. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orders` | array | Yes | Array of order objects. Pass as JSON array. |

Order object fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | Yes | e.g. BTCUSDT |
| `side` | string | Yes | buy or sell |
| `orderType` | string | Yes | limit or market |
| `price` | string | No | Required for limit orders, e.g. "70000" |
| `size` | string | Yes | Quantity as string, e.g. "0.001" |

**Example:**
```bash
bgc spot spot_place_order --orders '[{"symbol":"BTCUSDT","side":"buy","orderType":"limit","price":"70000","size":"0.001"}]'
```

---

### `spot_place_plan_order` ✏️

Create a trigger/conditional order (stop-loss, take-profit). Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `triggerPrice` | string | Yes | Price that activates the order |
| `symbol` | string | Yes | Trading pair symbol |
| `side` | string | Yes | buy or sell |
| `orderType` | string | Yes | limit or market (execution type after trigger) |
| `size` | string | Yes | Quantity |
| `price` | string | No | Execution price for limit type |
| `triggerType` | string | No | mark_price, fill_price, or last_price (default) |

**Example:**
```bash
bgc spot spot_place_plan_order --symbol BTCUSDT --side sell --triggerPrice 68000 --orderType market --size 0.001
```

---

### `spot_get_orders`

Query open or historical spot orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `status` | string | No | open (default) or history |
| `symbol` | string | No | Filter by trading pair |
| `orderId` | string | No | Specific order id |
| `limit` | number | No | Result size, default 100 |

**Example:**
```bash
bgc spot spot_get_orders --status open
bgc spot spot_get_orders --status history --symbol BTCUSDT
```

---

### `spot_cancel_orders` ✏️

Cancel one or more spot orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol |
| `orderId` | string | No | Single order id |
| `orderIds` | array | No | Multiple order ids (max 50) |
| `cancelAll` | boolean | No | If true, cancel all open orders for symbol |

**Example:**
```bash
bgc spot spot_cancel_orders --symbol BTCUSDT --orderId 1234567890
bgc spot spot_cancel_orders --symbol BTCUSDT --cancelAll true
```

---

### `spot_get_fills`

Get spot fill/execution details. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol |
| `orderId` | string | No | Filter by order id |
| `limit` | number | No | Result size, default 100 |

**Example:**
```bash
bgc spot spot_get_fills --symbol BTCUSDT
```

---

## Module: futures

### `futures_get_ticker`

Get futures ticker. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | No | Contract symbol, e.g. BTCUSDT |

**Example:**
```bash
bgc futures futures_get_ticker --productType USDT-FUTURES --symbol BTCUSDT
```

---

### `futures_get_depth`

Get futures orderbook depth. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |
| `limit` | number | No | Depth levels, default 100 |

**Example:**
```bash
bgc futures futures_get_depth --productType USDT-FUTURES --symbol BTCUSDT
```

---

### `futures_get_candles`

Get futures K-line data. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |
| `granularity` | string | Yes | 1min, 5min, 15min, 30min, 1h, 4h, 6h, 12h, 1day, 3day, 1week, 1M |
| `priceType` | string | No | trade (default), index, or mark |

**Example:**
```bash
bgc futures futures_get_candles --productType USDT-FUTURES --symbol BTCUSDT --granularity 1h
```

---

### `futures_get_funding_rate`

Get current or historical funding rate. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |
| `history` | boolean | No | true for historical rates |

**Example:**
```bash
bgc futures futures_get_funding_rate --productType USDT-FUTURES --symbol BTCUSDT
```

---

### `futures_get_open_interest`

Get open interest for a contract. Public endpoint. Rate limit: 20 req/s per IP.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |

**Example:**
```bash
bgc futures futures_get_open_interest --productType USDT-FUTURES --symbol BTCUSDT
```

---

### `futures_place_order` ✏️

Place one or more futures orders. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `orders` | array | Yes | Array of futures order objects |

Order object fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol, e.g. BTCUSDT |
| `side` | string | Yes | buy or sell |
| `tradeSide` | string | Yes | open or close |
| `orderType` | string | Yes | limit or market |
| `size` | string | Yes | Quantity as string |
| `price` | string | No | Required for limit orders |
| `marginCoin` | string | Yes | e.g. USDT |

**Example:**
```bash
bgc futures futures_place_order --orders '[{"productType":"USDT-FUTURES","symbol":"BTCUSDT","side":"buy","tradeSide":"open","orderType":"limit","price":"70000","size":"0.001","marginCoin":"USDT"}]'
```

---

### `futures_set_leverage` ✏️

Set leverage for a futures position. [CAUTION] Affects risk. Private endpoint. Rate limit: 5 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |
| `marginCoin` | string | Yes | e.g. USDT |
| `leverage` | string | Yes | Leverage as string, e.g. "5". Max 10x per risk rules. |
| `holdSide` | string | No | long or short (for one-way mode, omit) |

**Example:**
```bash
bgc futures futures_set_leverage --productType USDT-FUTURES --symbol BTCUSDT --marginCoin USDT --leverage 5
```

---

### `futures_get_positions`

Get current open futures positions. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | No | Filter by contract |
| `history` | boolean | No | true for closed position history |

**Example:**
```bash
bgc futures futures_get_positions --productType USDT-FUTURES
```

---

### `futures_get_orders`

Query open or historical futures orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `status` | string | No | open or history |
| `symbol` | string | No | Filter by contract |

**Example:**
```bash
bgc futures futures_get_orders --productType USDT-FUTURES --status open
```

---

### `futures_cancel_orders` ✏️

Cancel futures orders. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** Yes — confirm with user before running

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | Yes | Contract symbol |
| `orderId` | string | No | Single order id |
| `cancelAll` | boolean | No | If true, cancel all open orders for symbol |

**Example:**
```bash
bgc futures futures_cancel_orders --productType USDT-FUTURES --symbol BTCUSDT --orderId 1234567890
```

---

### `futures_get_fills`

Get futures fill/execution details. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `productType` | string | Yes | USDT-FUTURES, USDC-FUTURES, or COIN-FUTURES |
| `symbol` | string | No | Filter by contract |
| `orderId` | string | No | Filter by order id |

**Example:**
```bash
bgc futures futures_get_fills --productType USDT-FUTURES
```

---

## Module: account

### `get_account_assets`

Get spot/futures/funding account balances. Private endpoint. Rate limit: 10 req/s per UID.

**Write operation:** No

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `accountType` | string | No | spot, futures, funding, or all (default) |
| `coin` | string | No | Filter by coin |
| `productType` | string | No | Required when accountType=futures |

**Example:**
```bash
bgc account get_account_assets
bgc account get_account_assets --accountType spot --coin USDT
```

---

## Excluded commands

The following commands are NOT available in this skill. Your virtual sub-account
API key has no permission for these operations. Do not attempt to call them.

| Command | Reason excluded |
|---------|----------------|
| `transfer` | Sub-account has no transfer permission. User controls all fund movements. |
| `withdraw` | Sub-account has no withdrawal permission by design (core security guarantee). |
| `manage_subaccounts` | Not relevant to agent trading operations. |

If `withdraw` appears to be callable, warn the user immediately — they may be
using a main-account API key. Recommend switching to a virtual sub-account key.
```

**Step 2: Verify**

```bash
grep "## Table of Contents" packages/bitget-agent-account-skill/references/commands.md
```
Expected: line with Table of Contents

**Step 3: Commit**

```bash
git add packages/bitget-agent-account-skill/references/commands.md
git commit -m "feat(bitget-agent-account-skill): add restricted commands.md reference"
```

---

### Task 5: Write `scripts/install.js`

**Files:**
- Create: `packages/bitget-agent-account-skill/scripts/install.js`

Pattern: copy `packages/bitget-skill/scripts/install.js` and change `bitget-skill` → `bitget-agent-account-skill`, and update `REF_FILES` to only `["commands.md", "auth-setup.md"]`.

**Step 1: Write the file**

Write `packages/bitget-agent-account-skill/scripts/install.js`:

```javascript
#!/usr/bin/env node
/**
 * Bitget Agent Account Skill Installer
 *
 * Usage:
 *   node scripts/install.js                    # postinstall: installs to Claude Code only (non-interactive)
 *   node scripts/install.js --interactive       # interactive: prompts to choose targets
 *   node scripts/install.js --target all        # install to all supported tools
 *   node scripts/install.js --target claude     # install to Claude Code only
 *   node scripts/install.js --target codex      # install to Codex only
 *   node scripts/install.js --target openclaw   # install to OpenClaw only
 *   node scripts/install.js --target claude,codex  # install to multiple targets
 */

import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const HOME = homedir();

// Skill destinations per AI tool
const TARGETS = {
  claude: {
    label: "Claude Code",
    skillDir: join(HOME, ".claude", "skills", "bitget-agent-account-skill"),
  },
  codex: {
    label: "Codex",
    skillDir: join(HOME, ".codex", "skills", "bitget-agent-account-skill"),
  },
  openclaw: {
    label: "OpenClaw",
    skillDir: join(HOME, ".openclaw", "skills", "bitget-agent-account-skill"),
  },
};

const REF_FILES = ["commands.md", "auth-setup.md"];

function installTo(targetKey) {
  const target = TARGETS[targetKey];
  const refsDir = join(target.skillDir, "references");

  mkdirSync(target.skillDir, { recursive: true });
  mkdirSync(refsDir, { recursive: true });

  const skillSrc = join(PKG_ROOT, "skills", "SKILL.md");
  copyFileSync(skillSrc, join(target.skillDir, "SKILL.md"));

  for (const f of REF_FILES) {
    const src = join(PKG_ROOT, "references", f);
    if (existsSync(src)) {
      copyFileSync(src, join(refsDir, f));
    }
  }

  console.log(`  ✓ ${target.label} → ${join(target.skillDir, "SKILL.md")}`);
}

async function promptTargets() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("\nBitget Agent Account Skill — choose installation targets:\n");
  const keys = Object.keys(TARGETS);
  keys.forEach((k, i) => {
    console.log(`  ${i + 1}. ${TARGETS[k].label}  (${TARGETS[k].skillDir})`);
  });
  console.log(`  ${keys.length + 1}. All of the above`);
  console.log();

  return new Promise((resolve) => {
    rl.question(
      `Enter numbers separated by commas [default: 1]: `,
      (answer) => {
        rl.close();
        const trimmed = answer.trim();
        if (!trimmed || trimmed === "1") {
          resolve(["claude"]);
          return;
        }
        if (trimmed === String(keys.length + 1)) {
          resolve(keys);
          return;
        }
        const selected = trimmed
          .split(",")
          .map((s) => parseInt(s.trim(), 10) - 1)
          .filter((i) => i >= 0 && i < keys.length)
          .map((i) => keys[i]);
        resolve(selected.length > 0 ? selected : ["claude"]);
      }
    );
  });
}

async function main() {
  const args = process.argv.slice(2);
  const isInteractive = args.includes("--interactive");
  const targetArg = args.find((a) => a.startsWith("--target=") || a === "--target");
  let targetValue = null;
  if (targetArg) {
    if (targetArg === "--target") {
      targetValue = args[args.indexOf("--target") + 1];
    } else {
      targetValue = targetArg.split("=")[1];
    }
  }

  let selectedKeys;

  if (isInteractive) {
    // Interactive mode — prompt user
    try {
      selectedKeys = await promptTargets();
    } catch {
      selectedKeys = ["claude"];
    }
  } else if (targetValue) {
    // --target flag
    if (targetValue === "all") {
      selectedKeys = Object.keys(TARGETS);
    } else {
      selectedKeys = targetValue
        .split(",")
        .map((s) => s.trim())
        .filter((k) => k in TARGETS);
      if (selectedKeys.length === 0) {
        console.warn(
          `Unknown target(s): ${targetValue}. Valid targets: ${Object.keys(TARGETS).join(", ")}, all`
        );
        process.exit(1);
      }
    }
  } else {
    // Default postinstall: Claude Code only, silent on failure
    try {
      installTo("claude");
    } catch (err) {
      console.warn("Could not auto-install skill:", err.message);
    }
    return;
  }

  console.log("\nInstalling Bitget Agent Account skill...");
  let ok = 0;
  for (const key of selectedKeys) {
    try {
      installTo(key);
      ok++;
    } catch (err) {
      console.warn(`  ✗ ${TARGETS[key].label}: ${err.message}`);
    }
  }
  console.log(`\nDone — installed to ${ok} of ${selectedKeys.length} targets.`);

  if (selectedKeys.includes("claude")) {
    console.log(
      "\nClaude Code: restart Claude Code to pick up the skill, or run:\n" +
        "  claude skills list"
    );
  }
  if (selectedKeys.includes("codex")) {
    console.log(
      "\nCodex: skill will be loaded automatically from ~/.codex/skills/bitget-agent-account-skill/"
    );
  }
  if (selectedKeys.includes("openclaw")) {
    console.log(
      "\nOpenClaw: skill will be loaded automatically from ~/.openclaw/skills/bitget-agent-account-skill/"
    );
  }
}

main();
```

**Step 2: Verify the script parses correctly**

```bash
node --input-type=module --eval "import('./packages/bitget-agent-account-skill/scripts/install.js')" 2>&1 | head -5
```
Expected: script runs (may install to `~/.claude/skills/bitget-agent-account-skill/`) without syntax errors.

**Step 3: Commit**

```bash
git add packages/bitget-agent-account-skill/scripts/install.js
git commit -m "feat(bitget-agent-account-skill): add install script"
```

---

### Task 6: Write `scripts/gen-references.js`

**Files:**
- Create: `packages/bitget-agent-account-skill/scripts/gen-references.js`

This script generates a restricted `commands.md` from `bitget-core` tool definitions, filtering to only agent-safe tools.

**Step 1: Write the file**

Write `packages/bitget-agent-account-skill/scripts/gen-references.js`:

```javascript
#!/usr/bin/env node
// Generates references/commands.md from bitget-core tool specs (agent-safe subset only)
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const refsDir = join(__dirname, "..", "references");
mkdirSync(refsDir, { recursive: true });

const { buildTools, loadConfig } = await import("bitget-core");

// Load all tools, then filter to agent-safe subset
const config = loadConfig({ modules: "all", readOnly: false });
const allTools = buildTools(config);

// Tools explicitly excluded from the agent account skill
const EXCLUDED_TOOLS = new Set([
  "transfer",
  "withdraw",
  "cancel_withdrawal",
  "get_deposit_address",
  "get_transaction_records",
  "manage_subaccounts",
]);

// Modules allowed for agent account skill
const ALLOWED_MODULES = new Set(["spot", "futures", "account"]);

const tools = allTools.filter(
  (t) => ALLOWED_MODULES.has(t.module) && !EXCLUDED_TOOLS.has(t.name)
);

const lines = [
  "# bgc Command Reference — Agent Account",
  "",
  "Auto-generated from bitget-core tool definitions (agent-safe subset).",
  "",
  "Excluded: `transfer`, `withdraw`, `manage_subaccounts` — virtual sub-account",
  "API key has no permission for these operations.",
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

// Table of contents
lines.push("## Table of Contents", "");
for (const [module, moduleTools] of Object.entries(byModule)) {
  const names = moduleTools.map((t) => t.name).join(", ");
  lines.push(`- [${module}](#module-${module}) — ${names}`);
}
lines.push("");
lines.push('> **Write operations** (marked ✏️) require user confirmation before execution.', "");

for (const [module, moduleTools] of Object.entries(byModule)) {
  lines.push(`## Module: ${module}`, "");
  for (const tool of moduleTools) {
    const writeMarker = tool.isWrite ? " ✏️" : "";
    lines.push(`### \`${tool.name}\`${writeMarker}`);
    lines.push("");
    lines.push(tool.description);
    lines.push("");
    lines.push(`**Write operation:** ${tool.isWrite ? "Yes — confirm with user before running" : "No"}`);
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
console.log(`Generated references/commands.md (${tools.length} agent-safe tools, ${allTools.length - tools.length} excluded)`);
```

**Step 2: Verify**

```bash
node packages/bitget-agent-account-skill/scripts/gen-references.js 2>&1
```
Expected output like: `Generated references/commands.md (N agent-safe tools, M excluded)`

**Step 3: Commit**

```bash
git add packages/bitget-agent-account-skill/scripts/gen-references.js
git commit -m "feat(bitget-agent-account-skill): add gen-references script with agent-safe filter"
```

---

### Task 7: Register package in pnpm workspace and verify install

**Files:**
- Read: `pnpm-workspace.yaml` (verify `packages/*` glob already covers new package)

**Step 1: Check workspace config**

```bash
cat pnpm-workspace.yaml
```
Expected: contains `packages/*` — the new package is automatically included.

**Step 2: Install dependencies (resolve workspace link)**

```bash
pnpm install
```
Expected: `bitget-agent-account-skill` appears in lockfile with `bitget-core` workspace link resolved.

**Step 3: Run gen-references to verify bitget-core import works**

```bash
cd packages/bitget-agent-account-skill && node scripts/gen-references.js
```
Expected: `Generated references/commands.md (N agent-safe tools, M excluded)`

**Step 4: Run install script dry-run to Claude target**

```bash
node packages/bitget-agent-account-skill/scripts/install.js --target claude
```
Expected:
```
Installing Bitget Agent Account skill...
  ✓ Claude Code → /Users/<you>/.claude/skills/bitget-agent-account-skill/SKILL.md

Done — installed to 1 of 1 targets.

Claude Code: restart Claude Code to pick up the skill, or run:
  claude skills list
```

**Step 5: Verify files were installed**

```bash
ls ~/.claude/skills/bitget-agent-account-skill/
ls ~/.claude/skills/bitget-agent-account-skill/references/
```
Expected:
```
SKILL.md  references/
commands.md  auth-setup.md
```

**Step 6: Commit**

```bash
git add pnpm-lock.yaml
git commit -m "feat(bitget-agent-account-skill): register in workspace, verify install"
```

---

### Task 8: Final verification

**Step 1: Verify package structure is complete**

```bash
find packages/bitget-agent-account-skill -type f | sort
```
Expected:
```
packages/bitget-agent-account-skill/package.json
packages/bitget-agent-account-skill/references/auth-setup.md
packages/bitget-agent-account-skill/references/commands.md
packages/bitget-agent-account-skill/scripts/gen-references.js
packages/bitget-agent-account-skill/scripts/install.js
packages/bitget-agent-account-skill/skills/SKILL.md
```

**Step 2: Verify SKILL.md frontmatter is valid**

```bash
head -8 packages/bitget-agent-account-skill/skills/SKILL.md
```
Expected: valid YAML frontmatter with `name:` and `description:` fields.

**Step 3: Verify commands.md excludes prohibited tools**

```bash
grep -c "transfer\|withdraw\|manage_subaccounts" packages/bitget-agent-account-skill/references/commands.md
```
Expected: only appears in the "Excluded commands" section (not as callable commands).

**Step 4: Confirm installed skill is readable**

```bash
head -20 ~/.claude/skills/bitget-agent-account-skill/SKILL.md
```
Expected: SKILL.md content starting with YAML frontmatter.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(bitget-agent-account-skill): complete package implementation"
```
