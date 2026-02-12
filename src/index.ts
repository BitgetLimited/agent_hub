import { parseArgs } from "node:util";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { SERVER_NAME, SERVER_VERSION } from "./constants.js";
import { createServer } from "./server.js";
import { toToolErrorPayload } from "./utils/errors.js";

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

function parseCli(): {
  modules?: string;
  readOnly: boolean;
  help: boolean;
  version: boolean;
} {
  const parsed = parseArgs({
    options: {
      modules: {
        type: "string",
      },
      "read-only": {
        type: "boolean",
        default: false,
      },
      help: {
        type: "boolean",
        default: false,
      },
      version: {
        type: "boolean",
        default: false,
      },
    },
    allowPositionals: false,
  });

  return {
    modules: parsed.values.modules,
    readOnly: parsed.values["read-only"],
    help: parsed.values.help,
    version: parsed.values.version,
  };
}

export async function main(): Promise<void> {
  const cli = parseCli();

  if (cli.help) {
    printHelp();
    return;
  }

  if (cli.version) {
    process.stdout.write(`${SERVER_VERSION}\n`);
    return;
  }

  const config = loadConfig({
    modules: cli.modules,
    readOnly: cli.readOnly,
  });
  const server = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const payload = toToolErrorPayload(error);
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = 1;
});
