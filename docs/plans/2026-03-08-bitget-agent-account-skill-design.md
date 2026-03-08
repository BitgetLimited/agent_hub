# Design: `bitget-agent-account-skill` Package

**Date:** 2026-03-08
**Status:** Approved
**Source reference:** `/Users/dannie.li/Downloads/bitget-agent-account/`

---

## Overview

Add a new package `packages/bitget-agent-account-skill/` to the monorepo. This skill gives an AI agent an **autonomous trader persona** with its own isolated Bitget virtual sub-account. It is distinct from the existing `bitget-skill`, which is a general-purpose tool assistant for the user's own account.

| | `bitget-skill` | `bitget-agent-account-skill` |
|---|---|---|
| Persona | Tool assistant | Autonomous AI Trader |
| Account | User's main/sub account | Agent's own virtual sub-account |
| Risk controls | User-managed | Built into skill prompt |
| Transfer/withdraw | Allowed (with confirmation) | Explicitly prohibited |
| Language | English | English |

---

## Decisions

- **Location:** New sibling package `packages/bitget-agent-account-skill/` (not inside `bitget-skill`)
- **Interface:** `bgc` CLI (consistent with existing `bitget-skill`, not MCP tools directly)
- **Install pattern:** Standalone install script, same pattern as `bitget-skill`
- **Language:** English only

---

## Package Structure

```
packages/bitget-agent-account-skill/
├── package.json
├── skills/
│   └── SKILL.md                  ← Core skill prompt (agent trader persona)
├── references/
│   ├── auth-setup.md             ← Sub-account creation + API key setup guide
│   └── commands.md               ← Restricted bgc command reference (no transfer/withdraw)
└── scripts/
    ├── install.js                ← Copies files to ~/.claude/skills/, ~/.codex/, ~/.openclaw/
    └── gen-references.js         ← Regenerates commands.md from bitget-core source
```

---

## `SKILL.md` Design

### Frontmatter
```yaml
---
name: bitget-agent-account
description: >
  Use this skill when you are acting as an autonomous AI Trader with your own
  isolated Bitget sub-account. Covers environment detection, account setup
  guidance, market queries, spot/futures trading, and risk controls via bgc CLI.
---
```

### Body sections (in order)

1. **Environment detection** — run `bgc account get_account_assets` + `bgc --version` to detect three states: ready / needs-funds / needs-setup
2. **Account setup guide** — guide user through virtual sub-account creation, API key with spot/futures permissions only, credential configuration, fund transfer; reference `auth-setup.md`
3. **Trading tools quick-reference** — `bgc spot`, `bgc futures`, `bgc account` commands only
4. **Pre-trade checklist** — ticker → depth → balance → position rules → rationale
5. **Risk control rules** (hard constraints):
   - Single trade ≤ 20% of available balance (unless user overrides)
   - Single asset concentration ≤ 50% of total assets
   - Futures leverage ≤ 10x (unless user overrides)
   - Pause after 3 consecutive losing trades; report to user
   - Warn and pause active trading at 20% total drawdown
6. **Communication standards** — proactive reporting events, operations requiring confirmation, autonomous decision scope after user authorization
7. **First interaction flow** — detect environment → report status → ask trading preferences

### Key constraints encoded in prompt
- `transfer` and `withdraw` are explicitly prohibited
- If `withdraw` is callable, immediately warn user they are using a main-account API key (security risk)
- Never hide losses or errors

---

## Reference Files

### `references/auth-setup.md`
- Why virtual sub-account (not main account API key) — withdrawal permission is absent by design
- Step-by-step: create virtual sub-account → create API key (spot/futures only, no wallet/transfer) → set env vars → transfer funds via Bitget app/web
- Security model explanation: fund isolation, permission scope locked at key creation

### `references/commands.md`
Restricted to agent-safe commands only:

| Category | Commands |
|---|---|
| Market data | `spot_get_ticker`, `spot_get_depth`, `spot_get_candles`, `futures_get_ticker`, `futures_get_depth`, `futures_get_candles`, `futures_get_funding_rate`, `futures_get_open_interest` |
| Spot trading | `spot_place_order`, `spot_place_plan_order`, `spot_get_orders`, `spot_cancel_orders`, `spot_get_fills` |
| Futures trading | `futures_place_order`, `futures_set_leverage`, `futures_get_positions`, `futures_get_orders`, `futures_cancel_orders`, `futures_get_fills` |
| Account | `get_account_assets` |
| **Excluded** | `transfer`, `withdraw`, `manage_subaccounts` — agent sub-account has no permission for these |

---

## `package.json`

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

---

## Install Script Design

Mirrors `bitget-skill/scripts/install.js` exactly, with these differences:
- Package name: `bitget-agent-account-skill`
- Skill dir: `~/.claude/skills/bitget-agent-account-skill/`
- Same `--interactive`, `--target`, `--target=all` flags
- Same targets: `claude`, `codex`, `openclaw`
- Reference files copied: `auth-setup.md`, `commands.md`

---

## Out of Scope

- MCP config templates (not needed — this skill uses `bgc` CLI)
- OpenClaw YAML frontmatter variant (can be added later)
- Strategy customization docs (user can extend `SKILL.md` manually)
