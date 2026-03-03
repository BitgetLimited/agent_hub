# bitget-skill

A [Claude Code skill](https://docs.anthropic.com/en/docs/claude-code) that gives Claude real-time access to the Bitget exchange by invoking the `bgc` CLI as a runtime bridge.

## Overview

| | |
|---|---|
| **npm** | `bitget-skill` |
| **Skill file** | `~/.claude/skills/bitget.md` |
| **References** | `~/.claude/skills/bitget-references/` |
| **Runtime** | `bgc` CLI (peer dependency) |
| **Node.js** | ≥ 18 |
| **Source** | `packages/bitget-skill/` |

## How It Works

Unlike the MCP server (which runs as a long-lived process), `bitget-skill` uses Claude Code's skill system:

1. When the user asks about Bitget, Claude loads the skill from `~/.claude/skills/bitget.md`
2. The skill instructs Claude to use the `Bash` tool to run `bgc` commands
3. `bgc` calls the Bitget API and returns JSON
4. Claude parses the JSON and presents the results

This pattern gives Claude **real-time data** without requiring a separate server process.

## Prerequisites

1. **Claude Code** installed
2. **`bgc` CLI** in PATH:
   ```bash
   npm install -g bitget-client
   bgc --version  # verify
   ```
3. **Credentials** set (for private endpoints):
   ```bash
   export BITGET_API_KEY="your-api-key"
   export BITGET_SECRET_KEY="your-secret-key"
   export BITGET_PASSPHRASE="your-passphrase"
   ```

## Installation

```bash
npm install -g bitget-skill
```

The `postinstall` script automatically copies the skill and reference files to:
- `~/.claude/skills/bitget.md` — main skill file
- `~/.claude/skills/bitget-references/commands.md` — full tool reference
- `~/.claude/skills/bitget-references/auth-setup.md` — auth setup guide
- `~/.claude/skills/bitget-references/error-codes.md` — error recovery guide

Verify the installation:
```bash
ls ~/.claude/skills/bitget.md
ls ~/.claude/skills/bitget-references/
```

## Manual Installation

If the post-install script fails (e.g., permission issues), install manually:

```bash
mkdir -p ~/.claude/skills/bitget-references

# Find where the package was installed
SKILL_DIR=$(npm root -g)/bitget-skill

cp "$SKILL_DIR/skills/bitget.md" ~/.claude/skills/
cp "$SKILL_DIR/references/"* ~/.claude/skills/bitget-references/
```

## Usage in Claude Code

Once installed, Claude Code automatically detects the skill. You can invoke it naturally:

> "What's the current BTC price?"

> "Show me my futures positions"

> "Place a limit buy order for 0.001 BTC at $60,000"

Claude will:
1. Load the `bitget` skill
2. Check that `bgc` is available and credentials are set
3. Run the appropriate `bgc` command
4. Parse and present the result

## Skill Content

The skill file (`~/.claude/skills/bitget.md`) contains:

### Prerequisites Check

Before executing any command, Claude verifies:
- `bgc --version` succeeds (binary in PATH)
- For private endpoints: credentials are configured

### Command Reference

Claude uses `~/.claude/skills/bitget-references/commands.md` — an auto-generated reference covering all 58 tools with:
- Parameters and their types
- Required vs optional params
- Example commands
- Write operation indicators

### Safety Rules

- Write operations (orders, withdrawals) require explicit user confirmation
- `--read-only` flag is applied when user asks for read-only access
- Error codes and recovery suggestions from `error-codes.md`

### Output Parsing

Claude understands `bgc`'s JSON output format:
```json
{
  "data": { ... },          // actual API result
  "endpoint": "/api/v2/...", // which endpoint was called
  "requestTime": "..."       // request timestamp
}
```

## Generating Updated References

If you update `bitget-core` to a newer version, regenerate the command reference:

```bash
npm install -g bitget-skill  # reinstall to get fresh references
# or manually:
node $(npm root -g)/bitget-skill/scripts/gen-references.js
```

The `gen-references.js` script reads tool definitions directly from `bitget-core` at runtime, so the reference is always in sync with the actual API surface.

## Package Structure

```
packages/bitget-skill/
├── skills/
│   └── bitget.md              # Main skill definition for Claude Code
├── references/
│   ├── commands.md            # Auto-generated full tool reference
│   ├── auth-setup.md          # Credential setup guide
│   └── error-codes.md         # Error code reference with recovery steps
├── scripts/
│   ├── install.js             # Post-install: copies files to ~/.claude/skills/
│   └── gen-references.js      # Generates commands.md from bitget-core tool specs
└── package.json
```

### `skills/bitget.md`

The skill definition loaded by Claude Code. Contains:
- Trigger description (when to activate the skill)
- Prerequisites check procedure
- `bgc` command syntax
- Module reference table
- Safety rules for write operations
- Error handling instructions
- Output parsing guide

### `references/commands.md`

Auto-generated from `bitget-core` tool definitions. Contains a complete reference for all 58 tools, organized by module, with parameter tables and example commands.

### `scripts/gen-references.js`

Imports `buildTools` and `loadConfig` from `bitget-core`, iterates all tool specs, and generates `references/commands.md`. Run this after upgrading `bitget-core` to keep the reference current.

### `scripts/install.js`

Post-install hook that:
1. Creates `~/.claude/skills/` and `~/.claude/skills/bitget-references/`
2. Copies `skills/bitget.md` to `~/.claude/skills/bitget.md`
3. Copies all reference files to `~/.claude/skills/bitget-references/`

Failures are non-fatal (warns but does not exit with error) to avoid breaking `npm install` in CI environments.

## Dependencies

| Package | Role |
|---|---|
| `bitget-client` | Peer dependency — `bgc` must be in PATH at runtime |

## Troubleshooting

**Claude says "bgc not found"**
Install the CLI: `npm install -g bitget-client`

**Skill not activating**
Check the file exists: `ls ~/.claude/skills/bitget.md`
If missing, run: `node $(npm root -g)/bitget-skill/scripts/install.js`

**Commands reference is out of date**
Regenerate: `node $(npm root -g)/bitget-skill/scripts/gen-references.js`

**Claude asking for confirmation on every trade**
This is intentional — the safety rules in the skill require explicit confirmation for write operations.
