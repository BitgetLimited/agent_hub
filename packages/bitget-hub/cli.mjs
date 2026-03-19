#!/usr/bin/env node

import { createRequire } from "node:module";
import { spawn as nodeSpawn } from "node:child_process";
import { createInterface } from "node:readline";

// ── Constants ──────────────────────────────────────────────────────────
const TARGET_PACKAGES = ["bitget-skill", "bitget-skill-hub", "bitget-client"];

const { version: CLI_VERSION } = createRequire(import.meta.url)(
  "./package.json"
);

const HELP = `
bitget-hub v${CLI_VERSION}

Usage:
  npx bitget-hub                                  Interactive menu
  npx bitget-hub upgrade-all                      Upgrade all packages to latest
  npx bitget-hub upgrade <pkg>                    Upgrade one package to latest
  npx bitget-hub rollback <pkg> --to <version>    Rollback to specific version

Flags:
  --dry-run     Preview commands without executing
  --version     Print version and exit
  --help, -h    Print this help and exit

Supported packages: ${TARGET_PACKAGES.join(", ")}
`.trim();

// ── Arg Parsing ────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = {
    help: args.includes("--help") || args.includes("-h"),
    version: args.includes("--version"),
    dryRun: args.includes("--dry-run"),
    to: args.includes("--to")
      ? args[args.indexOf("--to") + 1] || null
      : null,
  };
  const positional = args.filter(
    (a) =>
      !a.startsWith("--") &&
      !a.startsWith("-h") &&
      a !== flags.to
  );
  return { command: positional[0] || null, pkg: positional[1] || null, ...flags };
}

// ── Package Manager Detection ──────────────────────────────────────────
function detectPM() {
  const execPath = process.env.npm_execpath || "";
  return execPath.includes("pnpm") ? "pnpm" : "npm";
}

// ── Shell Helpers ──────────────────────────────────────────────────────

function exec(cmd, args, { dryRun = false } = {}) {
  const full = `${cmd} ${args.join(" ")}`;
  if (dryRun) {
    console.log(`[dry-run] $ ${full}`);
    return Promise.resolve(0);
  }
  console.log(`$ ${full}`);
  return new Promise((resolve, reject) => {
    const child = nodeSpawn(cmd, args, {
      stdio: ["ignore", "inherit", "inherit"],
      shell: false,
    });
    child.on("error", reject);
    child.on("close", (code) => resolve(code));
  });
}

function execCapture(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = nodeSpawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) =>
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() })
    );
  });
}

// ── Registry / Global Queries ──────────────────────────────────────────

async function getInstalledVersions(pm) {
  const { code, stdout } = await execCapture(pm, [
    "list",
    "-g",
    "--depth=0",
    "--json",
  ]);
  if (code !== 0 || !stdout) return new Map(TARGET_PACKAGES.map((p) => [p, null]));

  const data = JSON.parse(stdout);
  const deps = data.dependencies || {};
  return new Map(
    TARGET_PACKAGES.map((p) => [p, deps[p]?.version || null])
  );
}

async function getLatestVersion(pm, pkg) {
  const { code, stdout } = await execCapture(pm, ["view", pkg, "version"]);
  if (code !== 0 || !stdout) return null;
  return stdout.replace(/^"|"$/g, "");
}

async function getVersionHistory(pm, pkg) {
  const { code, stdout } = await execCapture(pm, [
    "view",
    pkg,
    "versions",
    "--json",
  ]);
  if (code !== 0 || !stdout) return [];
  const versions = JSON.parse(stdout);
  return Array.isArray(versions) ? versions.reverse() : [versions];
}

// ── Helpers ────────────────────────────────────────────────────────────

function validatePkg(pkg) {
  if (!pkg) {
    console.error("Error: package name required.");
    console.error(`Supported: ${TARGET_PACKAGES.join(", ")}`);
    process.exitCode = 1;
    return false;
  }
  if (!TARGET_PACKAGES.includes(pkg)) {
    console.error(`Unknown package. Supported: ${TARGET_PACKAGES.join(", ")}`);
    process.exitCode = 1;
    return false;
  }
  return true;
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function isInteractive() {
  return process.stdin.isTTY === true;
}

// ── Commands ───────────────────────────────────────────────────────────

async function cmdUpgradeAll(pm, dryRun) {
  console.log("\n🔄 Upgrading all packages to latest...\n");
  const installed = await getInstalledVersions(pm);
  let allOk = true;

  for (const pkg of TARGET_PACKAGES) {
    const current = installed.get(pkg);
    const latest = await getLatestVersion(pm, pkg);
    if (!latest) {
      console.error(`✗ Failed to fetch latest version for ${pkg}`);
      allOk = false;
      continue;
    }

    console.log(`\n── ${pkg} ──`);
    if (current === latest) {
      console.log(`  Already at latest (${latest}) — skipping`);
      continue;
    }

    if (current) {
      console.log(`  ${current} → ${latest}`);
      const code = await exec(pm, ["uninstall", "-g", pkg], { dryRun });
      if (code !== 0 && !dryRun) {
        console.error(`  ✗ Uninstall failed`);
        allOk = false;
        continue;
      }
    } else {
      console.log(`  Not installed — installing ${latest}`);
    }

    const code = await exec(pm, ["install", "-g", `${pkg}@${latest}`], {
      dryRun,
    });
    if (code !== 0 && !dryRun) {
      console.error(`  ✗ Install failed`);
      allOk = false;
    } else {
      console.log(`  ✓ ${pkg}@${latest}`);
    }
  }

  console.log(allOk ? "\n✓ All packages up to date." : "\n⚠ Some packages failed.");
  if (!allOk) process.exitCode = 1;
}

async function cmdUpgrade(pm, pkg, dryRun) {
  if (!validatePkg(pkg)) return;

  const installed = await getInstalledVersions(pm);
  const current = installed.get(pkg);
  const latest = await getLatestVersion(pm, pkg);

  if (!latest) {
    console.error(`✗ Failed to fetch latest version for ${pkg}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n── ${pkg} ──`);

  if (current === latest) {
    console.log(`Already at latest (${latest}) — skipping`);
    return;
  }

  if (current) {
    console.log(`${current} → ${latest}`);
    const code = await exec(pm, ["uninstall", "-g", pkg], { dryRun });
    if (code !== 0 && !dryRun) {
      console.error("✗ Uninstall failed");
      process.exitCode = 1;
      return;
    }
  } else if (isInteractive()) {
    const answer = await ask(
      `${pkg} is not installed globally. Install latest? (y/n) `
    );
    if (answer.toLowerCase() !== "y") {
      console.log("Cancelled.");
      return;
    }
  } else {
    console.log(`Not installed — installing ${latest}`);
  }

  const code = await exec(pm, ["install", "-g", `${pkg}@${latest}`], {
    dryRun,
  });
  if (code !== 0 && !dryRun) {
    console.error("✗ Install failed");
    process.exitCode = 1;
  } else {
    console.log(`✓ ${pkg}@${latest}`);
  }
}

async function cmdRollback(pm, pkg, toVersion, dryRun) {
  if (!validatePkg(pkg)) return;

  if (!toVersion && !isInteractive()) {
    console.error("rollback requires --to <version>");
    process.exitCode = 1;
    return;
  }

  const versions = await getVersionHistory(pm, pkg);
  if (versions.length === 0) {
    console.error(`✗ Failed to fetch version history for ${pkg}`);
    process.exitCode = 1;
    return;
  }

  let targetVersion = toVersion;

  if (!targetVersion) {
    const installed = await getInstalledVersions(pm);
    const current = installed.get(pkg);
    console.log(
      `\n${pkg} — ${current ? `current: ${current}` : "(not installed)"}`
    );
    console.log("Available versions:");
    const display = versions.slice(0, 20);
    display.forEach((v, i) => {
      const mark = v === current ? " (current)" : "";
      console.log(`  ${i + 1}. ${v}${mark}`);
    });
    if (versions.length > 20) {
      console.log(`  ... ${versions.length} versions total`);
    }

    const answer = await ask("Select version (0 to cancel): ");
    const idx = parseInt(answer, 10);
    if (idx === 0 || isNaN(idx) || idx < 1 || idx > display.length) {
      console.log("Cancelled.");
      return;
    }
    targetVersion = display[idx - 1];
  }

  if (!versions.includes(targetVersion)) {
    console.error(
      `✗ Version ${targetVersion} not found for ${pkg}. Use '${pm} view ${pkg} versions --json' to see available versions.`
    );
    process.exitCode = 1;
    return;
  }

  const installed = await getInstalledVersions(pm);
  const current = installed.get(pkg);

  if (current === targetVersion) {
    console.log(`Already at ${targetVersion} — skipping`);
    return;
  }

  console.log(`\n── ${pkg} → ${targetVersion} ──`);

  if (current) {
    const code = await exec(pm, ["uninstall", "-g", pkg], { dryRun });
    if (code !== 0 && !dryRun) {
      console.error("✗ Uninstall failed");
      process.exitCode = 1;
      return;
    }
  }

  const code = await exec(pm, ["install", "-g", `${pkg}@${targetVersion}`], {
    dryRun,
  });
  if (code !== 0 && !dryRun) {
    console.error("✗ Install failed");
    process.exitCode = 1;
  } else {
    console.log(`✓ ${pkg}@${targetVersion}`);
  }
}

async function interactiveMenu(pm, dryRun) {
  const installed = await getInstalledVersions(pm);

  console.log(`\nbitget-hub v${CLI_VERSION}\n`);
  console.log("? Select an action:");
  console.log("  1. Upgrade all packages to latest");
  console.log("  2. Upgrade a specific package");
  console.log("  3. Rollback a specific package");
  console.log("  0. Exit");

  const choice = await ask("\nEnter number: ");

  switch (choice) {
    case "1":
      return cmdUpgradeAll(pm, dryRun);

    case "2": {
      console.log("\nSelect package to upgrade:");
      TARGET_PACKAGES.forEach((p, i) => {
        const ver = installed.get(p);
        console.log(`  ${i + 1}. ${p} ${ver ? `(${ver})` : "(not installed)"}`);
      });
      const pkgChoice = await ask("Enter number: ");
      const idx = parseInt(pkgChoice, 10) - 1;
      if (idx < 0 || idx >= TARGET_PACKAGES.length) {
        console.log("Cancelled.");
        return;
      }
      return cmdUpgrade(pm, TARGET_PACKAGES[idx], dryRun);
    }

    case "3": {
      console.log("\nSelect package to rollback:");
      TARGET_PACKAGES.forEach((p, i) => {
        const ver = installed.get(p);
        console.log(`  ${i + 1}. ${p} ${ver ? `(${ver})` : "(not installed)"}`);
      });
      const pkgChoice = await ask("Enter number: ");
      const idx = parseInt(pkgChoice, 10) - 1;
      if (idx < 0 || idx >= TARGET_PACKAGES.length) {
        console.log("Cancelled.");
        return;
      }
      return cmdRollback(pm, TARGET_PACKAGES[idx], null, dryRun);
    }

    case "0":
      return;

    default:
      console.log("Invalid choice.");
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    console.log(HELP);
    return;
  }
  if (opts.version) {
    console.log(CLI_VERSION);
    return;
  }

  const pm = detectPM();

  if (opts.command === "upgrade-all") {
    return cmdUpgradeAll(pm, opts.dryRun);
  }

  if (opts.command === "upgrade") {
    return cmdUpgrade(pm, opts.pkg, opts.dryRun);
  }

  if (opts.command === "rollback") {
    return cmdRollback(pm, opts.pkg, opts.to, opts.dryRun);
  }

  if (!opts.command) {
    if (!isInteractive()) {
      console.log(HELP);
      return;
    }
    return interactiveMenu(pm, opts.dryRun);
  }

  console.error(`Unknown command: ${opts.command}`);
  console.log(HELP);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
