import { loadConfig, buildTools, BitgetRestClient, toToolErrorPayload, SERVER_VERSION } from "bitget-core";

function printHelp(): void {
  process.stdout.write(`
Usage: bgc <module> <tool> [--param value ...]

Modules: spot, futures, account, margin, copytrading, convert, earn, p2p, broker

Examples:
  bgc spot spot_get_ticker --symbol BTCUSDT
  bgc futures futures_get_positions
  bgc account account_get_balance

Options:
  --read-only     Only allow read/query tools
  --pretty        Pretty-print JSON output
  --help          Show this help
  --version       Show version

Auth (environment variables):
  BITGET_API_KEY, BITGET_SECRET_KEY, BITGET_PASSPHRASE
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.includes("--help") || argv.length === 0) {
    printHelp();
    return;
  }

  if (argv.includes("--version")) {
    process.stdout.write(`bgc (bitget-client) using bitget-core ${SERVER_VERSION}\n`);
    return;
  }

  const positionals = argv.filter((a) => !a.startsWith("--"));
  const module = positionals[0];
  const toolName = positionals[1];

  if (!module || !toolName) {
    process.stderr.write("Error: provide <module> <tool>\n");
    process.exitCode = 1;
    return;
  }

  const pretty = argv.includes("--pretty");
  const readOnly = argv.includes("--read-only");

  // Parse --key value pairs as tool arguments
  const toolArgs: Record<string, unknown> = {};
  const allArgs = argv;
  for (let i = 0; i < allArgs.length; i++) {
    const arg = allArgs[i];
    if (!arg || !arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "pretty" || key === "read-only" || key === "help" || key === "version") continue;
    const next = allArgs[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      // Coerce CLI string values to their natural types so number/boolean
      // validators in helpers.ts receive the correct types.
      if (next === "true") {
        toolArgs[key] = true;
      } else if (next === "false") {
        toolArgs[key] = false;
      } else if (next !== "" && !Number.isNaN(Number(next))) {
        toolArgs[key] = Number(next);
      } else {
        // Try to parse JSON strings (e.g. --orders '[{...}]')
        if (next.startsWith("[") || next.startsWith("{")) {
          try {
            toolArgs[key] = JSON.parse(next);
          } catch {
            toolArgs[key] = next;
          }
        } else {
          toolArgs[key] = next;
        }
      }
      i++;
    } else {
      toolArgs[key] = true;
    }
  }

  const config = loadConfig({ modules: module, readOnly });
  const client = new BitgetRestClient(config);
  const tools = buildTools(config);
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    process.stderr.write(`Error: tool "${toolName}" not found in module "${module}"\n`);
    process.exitCode = 1;
    return;
  }

  try {
    const result = await tool.handler(toolArgs, { config, client });
    const output = pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
    process.stdout.write(output + "\n");
  } catch (err: unknown) {
    const payload = toToolErrorPayload(err);
    process.stderr.write(JSON.stringify(payload, null, 2) + "\n");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exitCode = 1;
});
