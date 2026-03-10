#!/usr/bin/env node
/**
 * Bitget Indicator Skill Installer
 *
 * Copies SKILL.md, references, and Python source into the skill directory.
 * The installed skill is self-contained — no external path dependencies.
 *
 * Usage:
 *   node scripts/install.js                    # postinstall: installs to Claude Code only (non-interactive)
 *   node scripts/install.js --interactive       # interactive: prompts to choose targets
 *   node scripts/install.js --target all        # install to all supported tools
 *   node scripts/install.js --target claude     # install to Claude Code only
 *   node scripts/install.js --target codex      # install to Codex only
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

const SKILL_NAME = "bitget-indicator-skill";

const TARGETS = {
  claude: {
    label: "Claude Code",
    skillDir: join(HOME, ".claude", "skills", SKILL_NAME),
  },
  codex: {
    label: "Codex",
    skillDir: join(HOME, ".codex", "skills", SKILL_NAME),
  },
};

const REF_FILES = ["scenarios.md", "indicators.md"];
const SRC_FILES = ["kline_indicator_utils.py", "kline_indicators.py"];

function installTo(targetKey) {
  const target = TARGETS[targetKey];
  const refsDir = join(target.skillDir, "references");
  const srcDir = join(target.skillDir, "src");

  mkdirSync(target.skillDir, { recursive: true });
  mkdirSync(refsDir, { recursive: true });
  mkdirSync(srcDir, { recursive: true });

  const skillSrc = join(PKG_ROOT, "skills", "SKILL.md");
  copyFileSync(skillSrc, join(target.skillDir, "SKILL.md"));

  for (const f of REF_FILES) {
    const src = join(PKG_ROOT, "references", f);
    if (existsSync(src)) {
      copyFileSync(src, join(refsDir, f));
    }
  }

  for (const f of SRC_FILES) {
    const src = join(PKG_ROOT, "src", f);
    if (existsSync(src)) {
      copyFileSync(src, join(srcDir, f));
    }
  }

  console.log(`  ✓ ${target.label} → ${target.skillDir}`);
}

async function promptTargets() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("\nBitget Indicator Skill — choose installation targets:\n");
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
    try {
      selectedKeys = await promptTargets();
    } catch {
      selectedKeys = ["claude"];
    }
  } else if (targetValue) {
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
    try {
      installTo("claude");
    } catch (err) {
      console.warn("Could not auto-install skill:", err.message);
    }
    return;
  }

  console.log("\nInstalling Bitget Indicator skill...");
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

  console.log(
    "\nPython dependencies (if not already installed):\n" +
      "  pip install pandas numpy\n"
  );

  if (selectedKeys.includes("claude")) {
    console.log(
      "Claude Code: restart Claude Code to pick up the skill, or run:\n" +
        "  claude skills list"
    );
  }
  if (selectedKeys.includes("codex")) {
    console.log(
      "Codex: skill will be loaded automatically from ~/.codex/skills/" + SKILL_NAME + "/"
    );
  }
}

main();
