#!/usr/bin/env node
// Generates references/commands.md from bitget-core tool specs
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const refsDir = join(__dirname, "..", "references");
mkdirSync(refsDir, { recursive: true });

const { buildTools, loadConfig } = await import("bitget-core");

const config = loadConfig({ modules: "all", readOnly: false });
const tools = buildTools(config);

const lines = [
  "# bgc Command Reference",
  "",
  "Auto-generated from bitget-core tool definitions.",
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

for (const [module, moduleTools] of Object.entries(byModule)) {
  lines.push(`## Module: ${module}`, "");
  for (const tool of moduleTools) {
    lines.push(`### \`${tool.name}\``);
    lines.push("");
    lines.push(tool.description);
    lines.push("");
    lines.push(`**Write operation:** ${tool.isWrite ? "Yes — requires confirmation" : "No"}`);
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

writeFileSync(join(refsDir, "commands.md"), lines.join("\n"), "utf8");
console.log(`Generated references/commands.md (${tools.length} tools)`);
