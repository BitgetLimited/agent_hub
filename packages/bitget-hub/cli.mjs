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
    console.error(`未知包名，支持的包：${TARGET_PACKAGES.join(", ")}`);
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

  // TODO: dispatch to commands (upgrade-all, upgrade, rollback, interactive menu)

  if (!opts.command) {
    console.log(HELP);
    return;
  }

  console.error(`Unknown command: ${opts.command}`);
  console.log(HELP);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
