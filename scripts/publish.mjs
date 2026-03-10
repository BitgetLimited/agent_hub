#!/usr/bin/env node
/**
 * Publish packages to npmjs in dependency order.
 *
 * Usage:
 *   node scripts/publish.mjs                    # dry-run (shows what would be published)
 *   node scripts/publish.mjs --publish          # actually publish
 *   node scripts/publish.mjs --publish --tag next  # publish with a dist-tag
 *   node scripts/publish.mjs --package bitget-core # publish a single package
 *
 * Publish order (dependency-safe):
 *   1. bitget-core          (no workspace deps)
 *   2. bitget-client        (depends on bitget-core)
 *   2. bitget-mcp-server    (depends on bitget-core)
 *   3. bitget-skill         (devDep on bitget-core — no runtime deps)
 *   3. bitget-agent-account-skill  (devDep on bitget-core — no runtime deps)
 *
 * Prerequisites:
 *   - pnpm installed
 *   - Logged in to npm: `npm login` or NPM_TOKEN env var set
 *   - All packages built and tests passing
 */

import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Packages in publish order (earlier = must publish first)
const PUBLISH_ORDER = [
  // Tier 1: no workspace runtime deps
  "bitget-core",
  // Tier 2: depend on bitget-core
  "bitget-client",
  "bitget-mcp",
  // Tier 3: skill packages (no runtime workspace deps)
  "bitget-skill",
  "bitget-agent-account-skill",
];

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    publish: args.includes("--publish"),
    dryRun: !args.includes("--publish"),
    tag: args.includes("--tag") ? args[args.indexOf("--tag") + 1] : "latest",
    singlePackage: args.includes("--package")
      ? args[args.indexOf("--package") + 1]
      : null,
  };
}

function readPackageJson(pkgDir) {
  return JSON.parse(readFileSync(join(ROOT, "packages", pkgDir, "package.json"), "utf8"));
}

function getPublishedVersion(pkgName) {
  try {
    const result = spawnSync("npm", ["view", pkgName, "version", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.status !== 0) return null;
    return JSON.parse(result.stdout.trim());
  } catch {
    return null;
  }
}

function run(cmd, cwd, dryRun) {
  console.log(`  ${dryRun ? "[dry-run] " : ""}$ ${cmd}`);
  if (!dryRun) {
    execSync(cmd, { cwd, stdio: "inherit" });
  }
}

async function main() {
  const opts = parseArgs();

  console.log(`\n=== Bitget NPM Publish Script ===`);
  console.log(`Mode:    ${opts.dryRun ? "DRY RUN (pass --publish to actually publish)" : "LIVE PUBLISH"}`);
  console.log(`Tag:     ${opts.tag}`);
  if (opts.singlePackage) {
    console.log(`Package: ${opts.singlePackage} (single package mode)`);
  }
  console.log();

  // Determine which packages to publish
  let toPublish = PUBLISH_ORDER;
  if (opts.singlePackage) {
    if (!PUBLISH_ORDER.includes(opts.singlePackage)) {
      console.error(`Error: unknown package "${opts.singlePackage}". Valid: ${PUBLISH_ORDER.join(", ")}`);
      process.exitCode = 1;
      return;
    }
    toPublish = [opts.singlePackage];
  }

  let hasError = false;

  for (const pkgDir of toPublish) {
    const pkgJson = readPackageJson(pkgDir);
    const { name, version } = pkgJson;
    const pkgPath = join(ROOT, "packages", pkgDir);

    console.log(`\n─── ${name}@${version} ───`);

    // Check current published version
    const publishedVersion = getPublishedVersion(name);
    if (publishedVersion === version) {
      console.log(`  ✓ Already published at ${version} — skipping`);
      continue;
    }
    if (publishedVersion) {
      console.log(`  Published: ${publishedVersion}  →  Local: ${version}`);
    } else {
      console.log(`  Not yet published (new package)`);
    }

    try {
      // pnpm publish resolves workspace:* → real versions automatically
      const publishCmd = [
        "pnpm publish",
        "--access public",
        `--tag ${opts.tag}`,
        opts.dryRun ? "--dry-run" : "",
        "--no-git-checks",
      ]
        .filter(Boolean)
        .join(" ");

      run(publishCmd, pkgPath, false); // always run, dryRun flag is passed to pnpm
      console.log(`  ✓ ${opts.dryRun ? "Dry-run OK" : "Published"}: ${name}@${version}`);
    } catch (err) {
      console.error(`  ✗ Failed: ${name}@${version}`);
      console.error(`    ${err.message}`);
      hasError = true;
      if (!opts.singlePackage) {
        console.error("  Stopping — fix this package before continuing.");
        break;
      }
    }
  }

  console.log();
  if (hasError) {
    console.error("Publish completed with errors.");
    process.exitCode = 1;
  } else if (opts.dryRun) {
    console.log("Dry run complete. Run with --publish to actually publish.");
  } else {
    console.log("All packages published successfully.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
