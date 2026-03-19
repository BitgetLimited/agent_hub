#!/usr/bin/env node
/**
 * Bitget Skill Hub Installer
 *
 * Usage:
 *   node scripts/install.js                    # postinstall: Claude Code only (non-interactive)
 *   node scripts/install.js --interactive       # interactive: prompts to choose targets
 *   node scripts/install.js --target all        # install to all supported tools
 *   node scripts/install.js --target claude     # install to Claude Code only
 *   node scripts/install.js --target codex      # install to Codex only
 *   node scripts/install.js --target openclaw   # install to OpenClaw only
 *   node scripts/install.js --target claude,codex  # install to multiple targets
 */

import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const HOME = homedir();

const MCP_NAME = "market-data";
const MCP_URL = "https://datahub.noxiaohao.com/mcp";

const SKILL_NAMES = [
  "macro-analyst",
  "market-intel",
  "news-briefing",
  "sentiment-analyst",
  "technical-analysis",
];

const TECHNICAL_ANALYSIS_EXTRAS = {
  references: ["scenarios.md", "indicators.md"],
  src: ["kline_indicator_utils.py", "kline_indicators.py"],
};

const TARGETS = {
  claude: { label: "Claude Code", skillsDir: join(HOME, ".claude", "skills") },
  codex:  { label: "Codex",       skillsDir: join(HOME, ".codex",  "skills") },
  openclaw: { label: "OpenClaw",  skillsDir: join(HOME, ".openclaw", "skills") },
};

// ─── MCP Configuration ──────────────────────────────────────────────────────

function configureMcpClaude() {
  try {
    const output = execSync("claude mcp list", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    if (output.includes(MCP_NAME)) {
      console.log(`  ℹ market-data MCP already configured for Claude Code`);
      return;
    }
  } catch {
    // claude CLI not available — skip silently
  }

  try {
    execSync(
      `claude mcp add -s user ${MCP_NAME} --transport http ${MCP_URL}`,
      { stdio: "inherit" }
    );
    console.log(`  ✓ market-data MCP configured for Claude Code`);
  } catch (err) {
    console.warn(`  ✗ Could not configure MCP for Claude Code: ${err.message}`);
  }
}

function configureMcpCodex() {
  const configPath = join(HOME, ".codex", "config.toml");
  const entry = `\n[[mcp_servers]]\nname = "${MCP_NAME}"\ntype = "http"\nurl = "${MCP_URL}"\n`;

  if (existsSync(configPath)) {
    const content = readFileSync(configPath, "utf8");
    if (content.includes(`name = "${MCP_NAME}"`)) {
      console.log(`  ℹ market-data MCP already configured for Codex`);
      return;
    }
    writeFileSync(configPath, content + entry, "utf8");
  } else {
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, entry.trimStart(), "utf8");
  }
  console.log(`  ✓ market-data MCP configured for Codex (${configPath})`);
}

function configureMcpOpenClaw() {
  const configPath = join(HOME, ".openclaw", "config.json");
  const mcpEntry = { transport: "http", url: MCP_URL };

  let config = {};
  if (existsSync(configPath)) {
    try { config = JSON.parse(readFileSync(configPath, "utf8")); }
    catch { config = {}; }
    if (config?.mcp_servers?.[MCP_NAME]) {
      console.log(`  ℹ market-data MCP already configured for OpenClaw`);
      return;
    }
  } else {
    mkdirSync(dirname(configPath), { recursive: true });
  }

  config.mcp_servers = config.mcp_servers ?? {};
  config.mcp_servers[MCP_NAME] = mcpEntry;
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(`  ✓ market-data MCP configured for OpenClaw (${configPath})`);
}

function configureMcp(targetKey) {
  if (targetKey === "claude")   return configureMcpClaude();
  if (targetKey === "codex")    return configureMcpCodex();
  if (targetKey === "openclaw") return configureMcpOpenClaw();
}

// ─── Skill File Copy ─────────────────────────────────────────────────────────

function installSkillsTo(targetKey) {
  const { label, skillsDir } = TARGETS[targetKey];
  for (const skillName of SKILL_NAMES) {
    const destDir = join(skillsDir, skillName);
    mkdirSync(destDir, { recursive: true });
    copyFileSync(join(PKG_ROOT, "skills", skillName, "SKILL.md"), join(destDir, "SKILL.md"));

    if (skillName === "technical-analysis") {
      for (const [subDir, files] of Object.entries(TECHNICAL_ANALYSIS_EXTRAS)) {
        const destSubDir = join(destDir, subDir);
        mkdirSync(destSubDir, { recursive: true });
        for (const f of files) {
          const src = join(PKG_ROOT, "skills", skillName, subDir, f);
          if (existsSync(src)) {
            copyFileSync(src, join(destSubDir, f));
          }
        }
      }
    }
  }
  console.log(`  ✓ ${label} skills → ${skillsDir}`);
}

// ─── Per-Target Install ──────────────────────────────────────────────────────

function installTo(targetKey) {
  configureMcp(targetKey);
  installSkillsTo(targetKey);
}

// ─── Interactive Prompt ──────────────────────────────────────────────────────

async function promptTargets() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log("\nBitget Skill Hub — choose installation targets:\n");
  const keys = Object.keys(TARGETS);
  keys.forEach((k, i) => console.log(`  ${i + 1}. ${TARGETS[k].label}  (${TARGETS[k].skillsDir})`));
  console.log(`  ${keys.length + 1}. All of the above\n`);

  return new Promise((resolve) => {
    rl.question(`Enter numbers separated by commas [default: 1]: `, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (!trimmed || trimmed === "1") { resolve(["claude"]); return; }
      if (trimmed === String(keys.length + 1)) { resolve(keys); return; }
      const selected = trimmed
        .split(",")
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((i) => i >= 0 && i < keys.length)
        .map((i) => keys[i]);
      resolve(selected.length > 0 ? selected : ["claude"]);
    });
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isInteractive = args.includes("--interactive");
  const targetArg = args.find((a) => a.startsWith("--target=") || a === "--target");
  let targetValue = null;
  if (targetArg) {
    targetValue = targetArg === "--target"
      ? args[args.indexOf("--target") + 1]
      : targetArg.split("=")[1];
  }

  let selectedKeys;

  if (isInteractive) {
    try { selectedKeys = await promptTargets(); }
    catch { selectedKeys = ["claude"]; }
  } else if (targetValue) {
    if (targetValue === "all") {
      selectedKeys = Object.keys(TARGETS);
    } else {
      selectedKeys = targetValue.split(",").map((s) => s.trim()).filter((k) => k in TARGETS);
      if (selectedKeys.length === 0) {
        console.warn(`Unknown target(s): ${targetValue}. Valid: ${Object.keys(TARGETS).join(", ")}, all`);
        process.exit(1);
      }
    }
  } else {
    // Default postinstall: Claude Code only, silent on failure
    try { installTo("claude"); }
    catch (err) { console.warn("Could not auto-install:", err.message); }
    return;
  }

  console.log("\nInstalling Bitget Skill Hub...\n");
  let ok = 0;
  for (const key of selectedKeys) {
    console.log(`Installing to ${TARGETS[key].label}...`);
    try { installTo(key); ok++; }
    catch (err) { console.warn(`  ✗ ${TARGETS[key].label}: ${err.message}`); }
  }

  console.log(`\nDone — installed to ${ok} of ${selectedKeys.length} targets.`);
  console.log("\nPython dependencies for technical-analysis skill:");
  console.log("  pip install pandas numpy\n");
  if (selectedKeys.includes("claude"))   console.log("Claude Code: restart Claude Code or run: claude skills list");
  if (selectedKeys.includes("codex"))    console.log("Codex: skills will be loaded from ~/.codex/skills/");
  if (selectedKeys.includes("openclaw")) console.log("OpenClaw: skills will be loaded from ~/.openclaw/skills/");
}

main();
