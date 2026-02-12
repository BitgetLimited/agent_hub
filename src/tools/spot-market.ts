import type { ToolSpec } from "./types.js";
import {
  assertEnum,
  compactObject,
  readNumber,
  readString,
  asRecord,
} from "./helpers.js";
import { GRANULARITIES, publicRateLimit } from "./common.js";

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

export function registerSpotMarketTools(): ToolSpec[] {
  return [
    {
      name: "spot_get_ticker",
      module: "spot",
      description:
        "Get real-time ticker data for spot trading pair(s). Public endpoint. Rate limit: 20 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Trading pair symbol, e.g. BTCUSDT. Omit for all tickers.",
          },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const symbol = readString(args, "symbol");
        const response = await context.client.publicGet(
          "/api/v2/spot/market/tickers",
          compactObject({ symbol }),
          publicRateLimit("spot_get_ticker", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_depth",
      module: "spot",
      description:
        "Get orderbook depth for a spot trading pair. Public endpoint. Rate limit: 20 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair symbol, e.g. BTCUSDT" },
          type: {
            type: "string",
            enum: ["step0", "step1", "step2", "step3", "step4", "step5"],
            description: "Depth merge level. step0 means raw orderbook.",
          },
          limit: {
            type: "number",
            description: "Depth levels, default 150, max 150.",
          },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const symbol = readString(args, "symbol");
        const type = readString(args, "type") ?? "step0";
        const limit = readNumber(args, "limit");
        assertEnum(type, "type", ["step0", "step1", "step2", "step3", "step4", "step5"]);
        const path =
          type === "step0"
            ? "/api/v2/spot/market/orderbook"
            : "/api/v2/spot/market/merge-depth";
        const response = await context.client.publicGet(
          path,
          compactObject({ symbol, type, limit }),
          publicRateLimit("spot_get_depth", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_candles",
      module: "spot",
      description:
        "Get K-line data for spot trading pair. Public endpoint. Rate limit: 20 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair symbol, e.g. BTCUSDT" },
          granularity: {
            type: "string",
            enum: [...GRANULARITIES],
            description: "Candlestick period.",
          },
          startTime: { type: "string", description: "Start time in milliseconds." },
          endTime: { type: "string", description: "End time in milliseconds." },
          limit: { type: "number", description: "Result size, default 100, max 1000." },
        },
        required: ["symbol", "granularity"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const symbol = readString(args, "symbol");
        const granularity = readString(args, "granularity");
        assertEnum(granularity, "granularity", GRANULARITIES);
        const startTime = readString(args, "startTime");
        const endTime = readString(args, "endTime");
        const limit = readNumber(args, "limit");
        const path = startTime
          ? "/api/v2/spot/market/history-candles"
          : "/api/v2/spot/market/candles";
        const response = await context.client.publicGet(
          path,
          compactObject({ symbol, granularity, startTime, endTime, limit }),
          publicRateLimit("spot_get_candles", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_trades",
      module: "spot",
      description:
        "Get recent or historical trade records for spot symbol. Public endpoint. Rate limit: 10 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair symbol." },
          limit: { type: "number", description: "Result size, default 100, max 500." },
          startTime: { type: "string", description: "Start time in milliseconds." },
          endTime: { type: "string", description: "End time in milliseconds." },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const symbol = readString(args, "symbol");
        const limit = readNumber(args, "limit");
        const startTime = readString(args, "startTime");
        const endTime = readString(args, "endTime");
        const path = startTime
          ? "/api/v2/spot/market/fills-history"
          : "/api/v2/spot/market/fills";
        const response = await context.client.publicGet(
          path,
          compactObject({ symbol, limit, startTime, endTime }),
          publicRateLimit("spot_get_trades", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_symbols",
      module: "spot",
      description:
        "Get spot symbol info or coin chain info. Public endpoint. Rate limit: 20 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["symbols", "coins"],
            description: "symbols(default) or coins.",
          },
          symbol: { type: "string", description: "Specific symbol filter." },
          coin: { type: "string", description: "Specific coin filter." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const type = readString(args, "type") ?? "symbols";
        assertEnum(type, "type", ["symbols", "coins"]);
        const symbol = readString(args, "symbol");
        const coin = readString(args, "coin");
        const path =
          type === "coins"
            ? "/api/v2/spot/public/coins"
            : "/api/v2/spot/public/symbols";
        const response = await context.client.publicGet(
          path,
          compactObject({ symbol, coin }),
          publicRateLimit("spot_get_symbols", 20),
        );
        return normalize(response);
      },
    },
  ];
}
