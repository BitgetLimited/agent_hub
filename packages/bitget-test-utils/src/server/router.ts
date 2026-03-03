import type { IncomingMessage, ServerResponse } from "node:http";
import type { MockState } from "./state.js";

export type RouteHandler = (
  req: IncomingMessage,
  body: Record<string, unknown>,
  query: URLSearchParams,
  state: MockState,
) => Promise<unknown> | unknown;

export class Router {
  private routes = new Map<string, RouteHandler>();

  register(method: string, path: string, handler: RouteHandler): void {
    this.routes.set(`${method.toUpperCase()} ${path}`, handler);
  }

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    state: MockState,
  ): Promise<void> {
    const rawUrl = req.url ?? "/";
    const urlObj = new URL(rawUrl, "http://localhost");
    const path = urlObj.pathname;
    const query = urlObj.searchParams;
    const method = (req.method ?? "GET").toUpperCase();
    const key = `${method} ${path}`;

    // Check error overrides first
    const override = state.errorOverrides.get(key);
    if (override) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: override.code, msg: override.msg, data: null }));
      return;
    }

    // Auth check for private endpoints
    const isPrivate =
      method === "POST" ||
      path.includes("/account/") ||
      path.includes("/wallet/") ||
      path.includes("/trade/place") ||
      path.includes("/trade/cancel") ||
      path.includes("/mix/order/") ||
      path.includes("/mix/account/") ||
      path.includes("/mix/position/") ||
      path.includes("/earn/") ||
      path.includes("/user/") ||
      path.includes("/broker/") ||
      path.includes("/copy/") ||
      path.includes("/convert/trade") ||
      path.includes("/p2p/orderList") ||
      path.includes("/p2p/merchantInfo");

    if (isPrivate) {
      const hasKey = req.headers["access-key"];
      const hasSign = req.headers["access-sign"];
      const hasPassphrase = req.headers["access-passphrase"];
      const hasTimestamp = req.headers["access-timestamp"];
      if (!hasKey || !hasSign || !hasPassphrase || !hasTimestamp) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: "40017", msg: "Invalid API key", data: null }));
        return;
      }
    }

    // Read body for POST requests
    let body: Record<string, unknown> = {};
    if (method === "POST") {
      body = await readBody(req);
    }

    const handler = this.routes.get(key);
    if (!handler) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "40001", msg: `Unknown endpoint: ${key}`, data: null }));
      return;
    }

    try {
      const data = await Promise.resolve(handler(req, body, query, state));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "00000", msg: "success", data }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "50000", msg, data: null }));
    }
  }
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString();
      try {
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}
