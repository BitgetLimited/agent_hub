---
name: bitget
description: >
  Use when the user asks about Bitget exchange data, trading, account info,
  or wants to place/manage orders. Provides real-time access to Bitget APIs
  via the bgc CLI.
---

# Bitget Skill

You have access to the Bitget cryptocurrency exchange via the `bgc` CLI tool.

## Prerequisites Check

Before executing any command, verify:

1. `bgc` is available:
   ```bash
   bgc --version
   ```
   If not found, instruct the user to run: `npm install -g bitget-client`

2. For private endpoints (account, trading), credentials must be set:
   See `~/.claude/skills/bitget-references/auth-setup.md` for setup instructions.

## How to Call the API

Use the Bash tool to run `bgc` commands. All output is JSON.

```bash
bgc <module> <tool_name> [--param value ...]
```

## Full Command Reference

See `~/.claude/skills/bitget-references/commands.md` for the complete list of
all available tools, their parameters, and examples.

## Modules

| Module | Description |
|--------|-------------|
| `spot` | Spot market data and trading |
| `futures` | Futures/perpetuals market and trading |
| `account` | Account balances and info |
| `margin` | Margin trading |
| `copytrading` | Copy trading |
| `convert` | Asset conversion |
| `earn` | Earn/staking products |
| `p2p` | P2P trading |
| `broker` | Broker operations |

## Safety Rules

- Write operations (orders, withdrawals) require explicit user confirmation
- Check `~/.claude/skills/bitget-references/error-codes.md` for error recovery
- Use `--read-only` flag when the user only wants to query data

## Error Handling

If `bgc` returns an error JSON, read `ok: false` and `error.suggestion` to determine
the recovery action. Common fixes in `~/.claude/skills/bitget-references/error-codes.md`.

## Output Parsing

`bgc` returns raw API response JSON. Key fields:
- `data` — the actual result
- `endpoint` — which API endpoint was called
- `requestTime` — when the request was made
