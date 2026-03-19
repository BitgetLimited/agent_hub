# Design Spec: `bitget-hub` CLI

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

A zero-dependency, single-file CLI that lets end users (human or AI) install, upgrade, and rollback the globally-installed Bitget Agent Hub packages from npm.

Distributed via `npx bitget-hub` — no installation required.

---

## Target Packages

Hard-coded list of globally-installable packages:

| Package | npm name |
|---------|----------|
| Bitget Skill | `bitget-skill` |
| Skill Hub | `bitget-skill-hub` |
| CLI Client | `bitget-client` |

`bitget-mcp-server` is excluded — users run it via `npx -y bitget-mcp-server`, not as a global install.

---

## Package Structure

```
packages/bitget-hub/
├── package.json        # name: "bitget-hub", bin: { "bitget-hub": "./cli.mjs" }
└── cli.mjs             # all logic, zero external dependencies
```

---

## Commands

### Non-interactive (AI / scripted use)

```bash
npx bitget-hub upgrade-all                          # upgrade all target packages to latest
npx bitget-hub upgrade <pkg>                        # upgrade one package to latest
npx bitget-hub rollback <pkg> --to <version>        # rollback one package to specific version
npx bitget-hub --dry-run upgrade-all                # preview commands without executing
npx bitget-hub --version                            # print bitget-hub CLI version and exit
npx bitget-hub --help                               # print usage and exit
```

### Interactive (human use)

```bash
npx bitget-hub   # no arguments → interactive menu
```

Menu flow:
```
? 请选择操作:
  1. 升级全部包到最新版本
  2. 升级指定包
  3. 回滚指定包到历史版本
  0. 退出
```

- **选 1**: 检测已安装包 → 对每个目标包执行升级（含未安装的，见 upgrade-all 行为）→ 汇报结果
- **选 2**: 列出三个目标包（含当前版本或"未安装"）→ 选择 → 确认 → 升级
- **选 3**: 列出三个目标包（已安装显示当前版本，未安装标注"(未安装)"）→ 选择 → 从 npm 拉取历史版本列表 → 选择版本 → 确认 → 回滚（未安装时跳过卸载步骤，直接安装指定版本）

---

## Core Logic

### Package Manager Detection

Detect once at startup. Apply the detected package manager to **all** shell commands (list, view, uninstall, install).

1. Check `process.env.npm_execpath` — if it contains `pnpm`, use `pnpm`
2. Otherwise default to `npm`

> Note: `<pm> view` and `<pm> list -g` behave identically between npm and pnpm for this use case.

### Detect Installed Packages

```
<pm> list -g --depth=0 --json
```

Parse output to find which of the three target packages are globally installed and at what version. Packages not present in the output are treated as "not installed."

### Get Latest Version

```
<pm> view <pkg> version
```

### Get Version History (for rollback)

```
<pm> view <pkg> versions --json
```

Returns array of all published versions; present as a numbered list in interactive mode. Most recent version first.

### Upgrade / Rollback Execution

```
<pm> uninstall -g <pkg>
<pm> install -g <pkg>@<version>
```

Both steps run sequentially. Output is streamed to stdout in real time.

**stdio handling:** Use `stdio: ['ignore', 'inherit', 'inherit']` — stdin is always closed to prevent npm from prompting (e.g., 2FA, confirmation) which would deadlock in non-interactive/AI contexts. stdout and stderr are inherited for live output.

---

## Behavior: `upgrade-all`

For each of the three target packages:

1. Check if currently installed globally
2. **If installed:** check if already at latest — if yes, print skip; if no, uninstall + reinstall latest
3. **If not installed:** install latest directly (no prompt, no skip) — `upgrade-all` always ensures all three packages are at latest

This means `upgrade-all` is also a "ensure all installed at latest" command, not just an upgrader.

---

## Behavior: `upgrade <pkg>`

1. Check if `<pkg>` is one of the three target packages; error and exit if not
2. Check if currently installed globally
3. **If installed and already at latest:** print skip message, exit 0
4. **If installed but outdated:** uninstall + install latest
5. **If not installed:**
   - Interactive: prompt "未检测到全局安装，是否直接安装最新版？" (y/n)
   - Non-interactive: install directly without prompt

---

## Behavior: `rollback <pkg> --to <version>`

1. Validate `<pkg>` is a target package; error if not
2. Fetch version history from npm
3. Validate `<version>` exists in history; error and exit if not found
4. Uninstall current version (if installed) + install `<pkg>@<version>`

In interactive mode (no `--to` flag provided), show numbered version list from npm history for selection.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Package not globally installed (upgrade single) | Interactive: prompt to install; non-interactive: install directly |
| Package not globally installed (upgrade-all) | Install latest directly, no prompt |
| Package not globally installed (rollback) | Allow — effectively a fresh install of the pinned version; skip the uninstall step silently; show "(未安装)" label in interactive version-selection menu |
| Already at target version | Print skip message, exit 0, no uninstall/reinstall |
| Unknown package name | Print error "未知包名，支持的包：bitget-skill, bitget-skill-hub, bitget-client", exit 1 |
| npm/pnpm not available | Print error and exit 1 |
| Network failure | Stream npm/pnpm stderr output, suggest retry |
| Invalid version (rollback) | Validate version exists in npm history before executing; print error and exit 1 if not found |
| `rollback` called without `--to` in non-interactive mode | Print error "rollback requires --to <version>", exit 1 |

---

## Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | Print the commands that would run, without executing them |
| `--to <version>` | (with `rollback`) Target version string |
| `--version` | Print the `bitget-hub` CLI's own version and exit |
| `--help`, `-h` | Print usage |

---

## Implementation Notes

- **Zero external dependencies** — uses only Node.js builtins: `child_process`, `readline`, `process`
- **Interactive UI** — plain numbered menu via `readline`, no `inquirer` or similar
- **Streaming output** — use async `spawn` (not `execSync`/`spawnSync`) with `stdio: ['ignore', 'inherit', 'inherit']`; stdin always closed to prevent deadlock in AI/CI contexts. Await completion via the `close` event (wrap in a Promise). `execSync`/`spawnSync` buffer output until exit and will appear to hang on slow installs.
- **No test suite** — validated via `--dry-run` flag; logic is straightforward
- Published to npm as a public package; added to `PUBLISH_ORDER` in `scripts/publish.mjs` (after `bitget-skill-hub`)

### Publish script note

`scripts/publish.mjs` currently lists: `bitget-core`, `bitget-client`, `bitget-mcp`, `bitget-skill`. Two additions needed:
1. Add `bitget-skill-hub` (directory name in `packages/`) — it is already published on npm but missing from the script
2. Add `bitget-hub` (this new package)

Directory name → npm package name mapping:
- `packages/bitget-skill-hub/` → npm: `bitget-skill-hub`
- `packages/bitget-hub/` → npm: `bitget-hub`

---

## Out of Scope

- Managing `bitget-mcp-server` (npx-only package)
- Upgrading packages installed locally (project-level), not globally
- Cross-platform package manager detection beyond npm/pnpm
