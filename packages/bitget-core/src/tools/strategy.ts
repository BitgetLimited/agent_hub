import type { ToolSpec } from "./types.js";
import {
  asRecord,
  compactObject,
  readNumber,
  readString,
  requireString,
} from "./helpers.js";
import { privateRateLimit } from "./common.js";

function normalize(response: {
  endpoint: string;
  requestTime: string;
  data: unknown;
}): Record<string, unknown> {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data,
  };
}

export function registerStrategyTools(): ToolSpec[] {
  return [
    {
      name: "strategy_get_current_strategies",
      module: "strategy",
      description: "Get current running strategies (bots). Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair symbol." },
          strategyType: {
            type: "string",
            enum: ["grid_spot", "grid_futures", "dca_spot", "dca_futures", "cta"],
            description: "Strategy type.",
          },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const query = compactObject({
          symbol: readString(args, "symbol"),
          strategyType: readString(args, "strategyType"),
        });
        const response = await context.client.privateGet(
          "/api/v2/strategy/current-strategies",
          query,
          privateRateLimit("strategy_get_current_strategies", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "strategy_get_grid_open_orders",
      module: "strategy",
      description: "Get open orders of a grid strategy. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair symbol." },
          id: { type: "string", description: "Strategy ID." },
        },
        required: ["symbol", "id"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const query = compactObject({
          symbol: requireString(args, "symbol"),
          id: requireString(args, "id"),
        });
        const response = await context.client.privateGet(
          "/api/v2/strategy/grid-open-orders",
          query,
          privateRateLimit("strategy_get_grid_open_orders", 10),
        );
        return normalize(response);
      },
    },
  ];
}
