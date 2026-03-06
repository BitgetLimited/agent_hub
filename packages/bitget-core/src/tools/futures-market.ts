import type { ToolSpec } from "./types.js";
import {
  asRecord,
  assertEnum,
  compactObject,
  readBoolean,
  readNumber,
  readString,
  requireString,
} from "./helpers.js";
import { GRANULARITIES, PRODUCT_TYPES, publicRateLimit } from "./common.js";

const FUTURES_GRANULARITY_MAP: Record<string, string> = {
  "1min": "1m",
  "5min": "5m",
  "15min": "15m",
  "30min": "30m",
  "1h": "1H",
  "4h": "4H",
  "6h": "6H",
  "12h": "12H",
  "1day": "1D",
  "3day": "3D",
  "1week": "1W",
  "1M": "1M",
};

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

export function registerFuturesMarketTools(): ToolSpec[] {
  return [
    {
      name: "futures_get_ticker",
      module: "futures",
      description:
        "Get futures ticker for one symbol or all symbols in product type. Public endpoint. Rate limit: 20 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: {
            type: "string",
            enum: [...PRODUCT_TYPES],
            description: "Futures product type.",
          },
          symbol: { type: "string", description: "Contract symbol, e.g. BTCUSDT." },
        },
        required: ["productType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const symbol = readString(args, "symbol");
        const path = symbol
          ? "/api/v2/mix/market/ticker"
          : "/api/v2/mix/market/tickers";
        const response = await context.client.publicGet(
          path,
          compactObject({ productType, symbol }),
          publicRateLimit("futures_get_ticker", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_depth",
      module: "futures",
      description:
        "Get futures orderbook depth with precision levels. Public endpoint. Rate limit: 20 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string", description: "Contract symbol." },
          limit: { type: "number", description: "Depth levels, default 100." },
          precision: { type: "string", description: "Merge precision value." },
        },
        required: ["productType", "symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const symbol = requireString(args, "symbol");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const response = await context.client.publicGet(
          "/api/v2/mix/market/merge-depth",
          compactObject({
            productType,
            symbol,
            limit: readNumber(args, "limit"),
            precision: readString(args, "precision"),
          }),
          publicRateLimit("futures_get_depth", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_candles",
      module: "futures",
      description:
        "Get futures candles from trade/index/mark price sources. Public endpoint. Rate limit: 20 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string" },
          granularity: { type: "string", enum: [...GRANULARITIES] },
          priceType: {
            type: "string",
            enum: ["trade", "index", "mark"],
            description: "trade(default), index, or mark.",
          },
          startTime: { type: "string" },
          endTime: { type: "string" },
          limit: { type: "number" },
        },
        required: ["productType", "symbol", "granularity"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const symbol = requireString(args, "symbol");
        const granularity = requireString(args, "granularity");
        const priceType = readString(args, "priceType") ?? "trade";
        assertEnum(productType, "productType", PRODUCT_TYPES);
        assertEnum(granularity, "granularity", GRANULARITIES);
        assertEnum(priceType, "priceType", ["trade", "index", "mark"]);
        const apiGranularity = FUTURES_GRANULARITY_MAP[granularity] ?? granularity;
        const startTime = readString(args, "startTime");
        const endTime = readString(args, "endTime");
        const limit = readNumber(args, "limit");
        const path =
          priceType === "index"
            ? "/api/v2/mix/market/history-index-candles"
            : priceType === "mark"
              ? "/api/v2/mix/market/history-mark-candles"
              : startTime
                ? "/api/v2/mix/market/history-candles"
                : "/api/v2/mix/market/candles";
        const response = await context.client.publicGet(
          path,
          compactObject({
            productType,
            symbol,
            granularity: apiGranularity,
            startTime,
            endTime,
            limit,
          }),
          publicRateLimit("futures_get_candles", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_trades",
      module: "futures",
      description:
        "Get recent or historical futures trade records. Public endpoint. Rate limit: 10 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string" },
          limit: { type: "number" },
          startTime: { type: "string" },
          endTime: { type: "string" },
        },
        required: ["productType", "symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const symbol = requireString(args, "symbol");
        const startTime = readString(args, "startTime");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const path = startTime
          ? "/api/v2/mix/market/fills-history"
          : "/api/v2/mix/market/fills";
        const response = await context.client.publicGet(
          path,
          compactObject({
            productType,
            symbol,
            limit: readNumber(args, "limit"),
            startTime,
            endTime: readString(args, "endTime"),
          }),
          publicRateLimit("futures_get_trades", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_contracts",
      module: "futures",
      description:
        "Get futures contract configuration details. Public endpoint. Rate limit: 20 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string", description: "Optional symbol filter." },
        },
        required: ["productType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const response = await context.client.publicGet(
          "/api/v2/mix/market/contracts",
          compactObject({
            productType,
            symbol: readString(args, "symbol"),
          }),
          publicRateLimit("futures_get_contracts", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_funding_rate",
      module: "futures",
      description:
        "Get current or historical funding rates for a futures symbol. Public endpoint. Rate limit: 20 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string" },
          history: { type: "boolean", description: "true for historical funding rates." },
          pageSize: { type: "number", description: "Page size for history mode." },
          pageNo: { type: "number", description: "Page number for history mode." },
        },
        required: ["productType", "symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const symbol = requireString(args, "symbol");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const history = readBoolean(args, "history") ?? false;
        if (history) {
          const historyResponse = await context.client.publicGet(
            "/api/v2/mix/market/history-fund-rate",
            compactObject({
              productType,
              symbol,
              pageSize: readNumber(args, "pageSize"),
              pageNo: readNumber(args, "pageNo"),
            }),
            publicRateLimit("futures_get_funding_rate", 20),
          );
          return normalize(historyResponse);
        }

        const [currentRate, fundingTime] = await Promise.all([
          context.client.publicGet(
            "/api/v2/mix/market/current-fund-rate",
            compactObject({ productType, symbol }),
            publicRateLimit("futures_get_funding_rate_current", 20),
          ),
          context.client.publicGet(
            "/api/v2/mix/market/funding-time",
            compactObject({ productType, symbol }),
            publicRateLimit("futures_get_funding_rate_time", 20),
          ),
        ]);

        return {
          endpoint: `${currentRate.endpoint} + ${fundingTime.endpoint}`,
          requestTime: new Date().toISOString(),
          data: {
            currentFundRate: currentRate.data,
            fundingTime: fundingTime.data,
          },
        };
      },
    },
    {
      name: "futures_get_open_interest",
      module: "futures",
      description:
        "Get open interest for a futures contract. Public endpoint. Rate limit: 20 req/s per IP.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string" },
        },
        required: ["productType", "symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const symbol = requireString(args, "symbol");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const response = await context.client.publicGet(
          "/api/v2/mix/market/open-interest",
          compactObject({ productType, symbol }),
          publicRateLimit("futures_get_open_interest", 20),
        );
        return normalize(response);
      },
    },
  ];
}
