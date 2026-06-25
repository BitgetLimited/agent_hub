# Changelog

All notable changes to `bitget-agent-installer` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-06-22

Version realigned from `1.1.0` to `3.0.0` so the installer shares one version line
with the agent family it manages. The jump is the family's, not the installer's:
`@bitget-ai/bitget-agent-sdk` now wraps the **Bitget UTA (Unified Trading Account) v3 API**,
and `bitget-agent-cli`, `bitget-agent-mcp`, and `bitget-agent-skill` were all released as
3.0.0 on top of it. Pinning the installer to the same number removes the "which version
goes with which" guesswork.

### Changed
- **Version 1.1.0 → 3.0.0** to match the UTA v3 agent family (`sdk` / `cli` / `mcp` / `skill` all 3.0.0).
- **`upgrade-all` now pulls the 3.0.0 family.** Because the installer resolves every managed
  package at `@latest`, `npx @bitget-ai/bitget-agent-installer upgrade-all` installs the UTA v3
  releases with no flag changes. Existing v2 installs are uninstalled and replaced in place.

### Unchanged
- **All commands and flags** — `upgrade-all`, `upgrade <pkg>`, `rollback <pkg> --to <version>`,
  `install [pkg] [--target <tools>]`, `--dry-run`, `--target`. The installer is unchanged JS;
  only the version and docs moved.
- **Managed package set** — still `@bitget-ai/bitget-agent-skill`, `@bitget-ai/bitget-signal`,
  `@bitget-ai/bitget-agent-cli`. `@bitget-ai/bitget-agent-mcp` is **not** managed here by design:
  it is launched on demand via `npx` by its MCP host, so there is no global install to upgrade or roll back.
- **`@bitget-ai/bitget-signal` is independent.** It is a market-signal product with no Bitget API
  key and no account access, so it was **not** part of the UTA v3 upgrade and keeps its own version.
  The installer continues to deploy it alongside the Trading Stack surfaces.
- **Deploy targets** — Claude Code, Codex, OpenClaw (`--target claude,codex,openclaw,all`).
- **Cross-repo MCP smoke test** (`npm run e2e`) still ships in this repo. Its tool arguments were
  updated to the UTA v3 verb surface; it requires `@bitget-ai/bitget-agent-mcp@3.0.0` to be
  published before it can run green end-to-end.

## [1.1.0] - 2026-05-29

### Added
- **Provenance attestations** on published artefacts (`publishConfig.provenance: true`) for supply-chain verification on npm.

### Changed
- **Renamed package: `bitget-hub` → `bitget-agent-installer`.** The new name describes what the tool actually does: install, upgrade, and rollback the Bitget agent package family across multiple AI hosts. The previous `bitget-hub` name is no longer maintained on npm.
- **Renamed binary: `bitget-hub` → `bitget-agent-installer`.** Update any wrapper scripts:
  ```diff
  - npx bitget-hub upgrade-all
  + npx bitget-agent-installer upgrade-all
  ```
- **Repo unchanged** (`Bitget-AI/agent_hub`). Only the npm package name changed. The portal repo continues to host docs, assets, the cross-repo e2e test, and the installer source under `installer/cli.mjs`.
- **`TARGET_PACKAGES` updated** to the new package family:
  ```diff
  - ["bitget-skill", "bitget-signal", "bitget-client"]
  + ["bitget-agent-skill", "bitget-signal", "bitget-agent-cli"]
  ```
- **Bug fix: `--version` was crashing.** The installer's `cli.mjs` referenced `./package.json` with a path that broke after the script moved into the `installer/` subdirectory during the monorepo split. Now correctly resolves `../package.json`. Without this fix, every invocation of `bitget-agent-installer --version`, `--help`, or any subcommand would have thrown `Cannot find module './package.json'`.
- **Bug fix: e2e smoke-test report path.** `e2e/mcp-smoke-test.mjs` previously wrote to `scripts/mcp-smoke-report.*.json`, a path that no longer exists after the split. Now writes to the current working directory.
- **Minimum Node.js version: 20.0.0** (was 18). Node 18 reached end-of-life in April 2025.

### Unchanged
- All commands and flags: `upgrade-all`, `upgrade <pkg>`, `rollback <pkg> --to <version>`, `install [pkg] [--target <tools>]`, `--dry-run`, `--target`, `--interactive`.
- Cross-repo MCP smoke test (`npm run e2e`) — same coverage, same WARN/PASS criteria.
- Documentation portal lives in this repo's `docs/` directory.

[3.0.0]: https://github.com/Bitget-AI/agent_hub/releases/tag/v3.0.0
[1.1.0]: https://github.com/Bitget-AI/agent_hub/releases/tag/v1.1.0
