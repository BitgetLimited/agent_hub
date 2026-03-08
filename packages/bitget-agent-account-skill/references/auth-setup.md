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
