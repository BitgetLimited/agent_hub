#!/usr/bin/env node
// Generates references/commands.md from bitget-core tool specs (agent-safe subset only)
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const refsDir = join(__dirname, "..", "references");
mkdirSync(refsDir, { recursive: true });

const { buildTools, loadConfig } = await import("bitget-core");

// Load all tools, then filter to agent-safe subset
const config = loadConfig({ modules: "all", readOnly: false });
const allTools = buildTools(config);

// Tools explicitly excluded from the agent account skill
const EXCLUDED_TOOLS = new Set([
  "transfer",
  "withdraw",
  "cancel_withdrawal",
  "get_deposit_address",
  "get_transaction_records",
  "manage_subaccounts",
]);

// Modules allowed for agent account skill
const ALLOWED_MODULES = new Set(["spot", "futures", "account"]);

const tools = allTools.filter(
  (t) => ALLOWED_MODULES.has(t.module) && !EXCLUDED_TOOLS.has(t.name)
);

if (tools.length === 0) {
  console.error("ERROR: filter produced zero tools — check ALLOWED_MODULES and EXCLUDED_TOOLS");
  process.exit(1);
}

const lines = [
  "# bgc Command Reference — Agent Account",
  "",
  "Auto-generated from bitget-core tool definitions (agent-safe subset).",
  "",
  "Excluded: `transfer`, `withdraw`, `cancel_withdrawal`, `get_deposit_address`,",
  "`get_transaction_records`, `manage_subaccounts` — virtual sub-account API key",
  "has no permission for these operations.",
  "",
  "## Usage",
  "",
  "```",
  "bgc <module> <tool_name> [--param value ...]",
  "```",
  "",
];

const byModule = {};
for (const tool of tools) {
  if (!byModule[tool.module]) byModule[tool.module] = [];
  byModule[tool.module].push(tool);
}

// Table of contents
lines.push("## Table of Contents", "");
for (const [module, moduleTools] of Object.entries(byModule)) {
  const names = moduleTools.map((t) => t.name).join(", ");
  lines.push(`- [${module}](#module-${module}) — ${names}`);
}
lines.push("");
lines.push('> **Write operations** (marked ✏️) require user confirmation before execution.', "");

for (const [module, moduleTools] of Object.entries(byModule)) {
  lines.push(`## Module: ${module}`, "");
  for (const tool of moduleTools) {
    const writeMarker = tool.isWrite ? " ✏️" : "";
    lines.push(`### \`${tool.name}\`${writeMarker}`);
    lines.push("");
    lines.push(tool.description);
    lines.push("");
    lines.push(`**Write operation:** ${tool.isWrite ? "Yes — confirm with user before running" : "No"}`);
    lines.push("");

    const props = tool.inputSchema?.properties ?? {};
    const required = tool.inputSchema?.required ?? [];
    if (Object.keys(props).length > 0) {
      lines.push("**Parameters:**", "");
      lines.push("| Name | Type | Required | Description |");
      lines.push("|------|------|----------|-------------|");
      for (const [name, schema] of Object.entries(props)) {
        const req = required.includes(name) ? "Yes" : "No";
        const desc = schema.description ?? "";
        lines.push(`| \`${name}\` | ${schema.type ?? "any"} | ${req} | ${desc} |`);
      }
      lines.push("");
    }

    lines.push("**Example:**", "```bash");
    const exampleArgs = Object.entries(props)
      .slice(0, 2)
      .map(([k]) => `--${k} <value>`)
      .join(" ");
    lines.push(`bgc ${module} ${tool.name}${exampleArgs ? " " + exampleArgs : ""}`);
    lines.push("```", "");
  }
}

// Append excluded commands section
lines.push("## Excluded Commands", "");
lines.push(
  "The following account tools are NOT available in this skill.",
  "Your virtual sub-account API key has no permission for these operations.",
  "",
  "| Command | Reason |",
  "|---------|--------|",
  "| `transfer` | Sub-account has no transfer permission. Fund movements are user-controlled. |",
  "| `withdraw` | No withdrawal permission by design — core security guarantee. |",
  "| `cancel_withdrawal` | No withdrawal operations available. |",
  "| `get_deposit_address` | Not needed for agent trading operations. |",
  "| `get_transaction_records` | Not needed for agent trading operations. |",
  "| `manage_subaccounts` | Not relevant to agent trading operations. |",
  "",
  "> If `withdraw` appears callable, warn the user — they may be using a main-account API key.",
  ""
);

writeFileSync(join(refsDir, "commands.md"), lines.join("\n"), "utf8");
console.log(`Generated references/commands.md (${tools.length} agent-safe tools, ${allTools.length - tools.length} excluded)`);
