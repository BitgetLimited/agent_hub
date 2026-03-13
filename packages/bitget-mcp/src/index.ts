import { parseArgs } from "node:util";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, SERVER_NAME, SERVER_VERSION, toToolErrorPayload } from "bitget-core";
import { createServer } from "./server.js";

function printHelp(): void {
  const help = `
Usage: ${SERVER_NAME} [options]

Options:
  --modules <list>     Comma-separated list of modules to load
                       Available: spot, futures, account, margin, copytrading,
                       convert, earn, p2p, broker
                       Special: "all" loads all modules
                       Default: spot,futures,account

  --read-only          Expose only read/query tools and disable write operations
  --paper-trading      Enable Demo Trading mode (requires Demo API Key)
                       All requests will include the paptrading: 1 header
  --help               Show this help message
  --version            Show version

Environment Variables:
  BITGET_API_KEY       Bitget API key (required for private endpoints)
  BITGET_SECRET_KEY    Bitget secret key (required for private endpoints)
  BITGET_PASSPHRASE    Bitget passphrase (required for private endpoints)
  BITGET_API_BASE_URL  Optional API base URL (default: https://api.bitget.com)
  BITGET_TIMEOUT_MS    Optional request timeout in milliseconds (default: 15000)
`;
  process.stdout.write(help);
}

function parseCli(): { modules?: string; readOnly: boolean; paperTrading?: boolean; help: boolean; version: boolean } {
  const parsed = parseArgs({
    options: {
      modules: { type: "string" },
      "read-only": { type: "boolean", default: false },
      "paper-trading": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
      version: { type: "boolean", default: false },
    },
    allowPositionals: false,
  });
  return {
    modules: parsed.values.modules,
    readOnly: parsed.values["read-only"],
    paperTrading: parsed.values["paper-trading"],
    help: parsed.values.help,
    version: parsed.values.version,
  };
}

export async function main(): Promise<void> {
  const cli = parseCli();
  if (cli.help) { printHelp(); return; }
  if (cli.version) { process.stdout.write(`${SERVER_VERSION}\n`); return; }
  const config = loadConfig({ modules: cli.modules, readOnly: cli.readOnly, paperTrading: cli.paperTrading ?? false });
  const server = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const payload = toToolErrorPayload(error);
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = 1;
});
