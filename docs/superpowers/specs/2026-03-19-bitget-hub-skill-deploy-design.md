# Design Spec: `bitget-hub` Skill Deployment Extension

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

Extend `bitget-hub` CLI to deploy skills from `bitget-skill` and `bitget-skill-hub` to AI tools (Claude Code, Codex, OpenClaw) — both as a standalone `install` command and optionally after upgrade/rollback via `--target`.

---

## Skill Packages

Only two of the three target packages contain installable skills:

| Package | Has skills | Install script path (relative to global install) |
|---------|-----------|--------------------------------------------------|
| `bitget-skill` | Yes — 1 trading skill | `scripts/install.js` |
| `bitget-skill-hub` | Yes — 5 market analysis skills | `scripts/install.js` |
| `bitget-client` | No — CLI tool only | N/A |

Both install scripts already support `--target claude`, `--target codex`, `--target openclaw`, `--target all`, and comma-separated values like `--target claude,codex`.

---

## AI Tool Targets

| Key | Label | Skills directory |
|-----|-------|-----------------|
| `claude` | Claude Code | `~/.claude/skills/` |
| `codex` | Codex | `~/.codex/skills/` |
| `openclaw` | OpenClaw | `~/.openclaw/skills/` |

Default target (when not specified): `claude`.

---

## New Command: `install`

```bash
npx bitget-hub install                                        # deploy both skill packages → Claude Code
npx bitget-hub install bitget-skill                           # deploy one package → Claude Code
npx bitget-hub install --target all                           # deploy both → all 3 tools
npx bitget-hub install bitget-skill-hub --target codex,openclaw
npx bitget-hub install --dry-run --target all                 # preview without executing
```

- If `<pkg>` is omitted, deploy both `bitget-skill` and `bitget-skill-hub`.
- Only `bitget-skill` and `bitget-skill-hub` are valid. `bitget-client` errors: "bitget-client does not contain installable skills".
- If the package is not globally installed, error: "bitget-skill is not globally installed. Run `npx bitget-hub upgrade bitget-skill` first."

---

## Extended: `--target` on upgrade/rollback

```bash
npx bitget-hub upgrade bitget-skill --target claude,codex
npx bitget-hub upgrade-all --target all
npx bitget-hub rollback bitget-skill --to 1.0.0 --target claude
```

- `--target` is **opt-in**: if absent, no skill deployment (backward-compatible).
- `--target` only takes effect for skill packages (`bitget-skill`, `bitget-skill-hub`); silently skipped for `bitget-client`.
- Skill deployment runs **after** a successful npm install/upgrade. If the npm step fails, skill deployment is skipped.

---

## Interactive Menu

```
? 请选择操作:
  1. 升级全部包到最新版本
  2. 升级指定包
  3. 回滚指定包到历史版本
  4. 安装技能到 AI 工具
  0. 退出
```

### Option 1 (upgrade-all)

After successful upgrade, auto-deploys skill packages to Claude Code (default target). No additional prompting.

### Option 4 (install skills)

Prompts for target selection, then package selection:

```
选择安装目标:
  1. Claude Code   (~/.claude/skills)
  2. Codex         (~/.codex/skills)
  3. OpenClaw      (~/.openclaw/skills)
  4. 全部
请输入编号 (可多选，逗号分隔): 1,2

选择要安装的技能包:
  1. bitget-skill      (交易技能)
  2. bitget-skill-hub  (市场分析技能 x5)
  3. 全部
请输入编号: 3
```

---

## Mechanical Implementation: Skill Deployment

Skill deployment runs the globally installed package's own install script with `--target`:

```bash
# 1. Find global node_modules path
<pm> root -g  →  e.g. /usr/local/lib/node_modules

# 2. Run the package's install script with --target
node <global_root>/bitget-skill/scripts/install.js --target claude
node <global_root>/bitget-skill-hub/scripts/install.js --target claude,codex
```

`<pm>` is the detected package manager (npm or pnpm), same as already used by `bitget-hub`.

**stdio handling:** Use `stdio: ['ignore', 'inherit', 'inherit']` (same as upgrade/rollback) so install script output streams in real time.

**dry-run:** When `--dry-run` is active, print the command that would be run without executing it.

---

## New Flag

| Flag | Description |
|------|-------------|
| `--target <targets>` | Comma-separated AI tool targets: `claude`, `codex`, `openclaw`, `all`. Default: `claude`. |

---

## Updated Help Text

```
bitget-hub v{version}

Usage:
  npx bitget-hub                                  Interactive menu
  npx bitget-hub upgrade-all [--target <tools>]   Upgrade all packages to latest
  npx bitget-hub upgrade <pkg> [--target <tools>] Upgrade one package to latest
  npx bitget-hub rollback <pkg> --to <version>    Rollback to specific version
  npx bitget-hub install [pkg] [--target <tools>] Deploy skills to AI tools

Flags:
  --target <t>  AI tool targets: claude, codex, openclaw, all (default: claude)
  --dry-run     Preview commands without executing
  --version     Print version and exit
  --help, -h    Print this help and exit

Supported packages: bitget-skill, bitget-skill-hub, bitget-client
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `install bitget-client` | Error: "bitget-client does not contain installable skills. Supported: bitget-skill, bitget-skill-hub" |
| `install bitget-skill` but not globally installed | Error: "bitget-skill is not globally installed. Run `npx bitget-hub upgrade bitget-skill` first." |
| `--target invalid` | Error: "Unknown target(s): invalid. Valid: claude, codex, openclaw, all" |
| Install script not found at expected path | Error: "Install script not found for {pkg}. Try reinstalling: `npx bitget-hub upgrade {pkg}`" |
| Install script fails (non-zero exit) | Print error, continue with remaining targets/packages |
| `--target` on `rollback` | Same opt-in behavior as upgrade; deploys after successful rollback |

---

## Out of Scope

- Modifying the install scripts inside `bitget-skill` or `bitget-skill-hub` — they already support `--target`
- Adding new AI tool targets beyond the existing three
- Deploying skills from non-globally-installed packages (e.g., npx-only)
