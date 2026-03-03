import { MockServer } from "../server/mock-server.js";

const args = process.argv.slice(2);
const portArg = args.indexOf("--port");
const port = portArg >= 0 ? parseInt(args[portArg + 1] ?? "3210", 10) : 3210;

const server = new MockServer();
const boundPort = await server.start(port);

process.stdout.write(`Bitget mock server running at http://localhost:${boundPort}\n`);
process.stdout.write(`Set BITGET_API_BASE_URL=http://localhost:${boundPort}\n`);
process.stdout.write(`Press Ctrl+C to stop.\n`);

process.on("SIGINT", () => {
  void server.stop().then(() => process.exit(0));
});
