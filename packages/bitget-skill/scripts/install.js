#!/usr/bin/env node
// Post-install: copies skill file into ~/.claude/skills/
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(homedir(), ".claude", "skills");
const refsDir = join(homedir(), ".claude", "skills", "bitget-references");

try {
  mkdirSync(skillsDir, { recursive: true });
  mkdirSync(refsDir, { recursive: true });

  const skillSrc = join(__dirname, "..", "skills", "bitget.md");
  const skillDst = join(skillsDir, "bitget.md");
  copyFileSync(skillSrc, skillDst);

  const refFiles = ["commands.md", "error-codes.md", "auth-setup.md"];
  for (const f of refFiles) {
    const src = join(__dirname, "..", "references", f);
    if (existsSync(src)) {
      copyFileSync(src, join(refsDir, f));
    }
  }

  console.log(`✓ Bitget skill installed to ${skillDst}`);
} catch (err) {
  // Non-fatal — skill can be installed manually
  console.warn("Could not auto-install skill:", err.message);
}
