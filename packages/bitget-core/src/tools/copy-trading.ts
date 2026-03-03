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
import { privateRateLimit, PRODUCT_TYPES } from "./common.js";
import { BitgetApiError, ValidationError } from "../utils/errors.js";

const COPY_PRODUCT_TYPES = [...PRODUCT_TYPES, "SPOT"] as const;

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

function isSpot(productType: string): boolean {
  return productType === "SPOT";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractTraderRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }
  if (!isRecord(data)) {
    return [];
  }
  const keys = ["list", "rows", "resultList", "traderList", "data"];
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
    if (isRecord(value)) {
      const nested = extractTraderRows(value);
      if (nested.length > 0) {
        return nested;
      }
    }
  }
  return [];
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function traderScore(row: Record<string, unknown>): number {
  const keys = [
    "followerNum",
    "followerCount",
    "copyCount",
    "winRate",
    "profitRate",
    "aum",
  ];
  return keys.reduce((acc, key) => acc + toNumber(row[key]), 0);
}

function traderIdFromRow(
  row: Record<string, unknown>,
  productType: string,
): string | undefined {
  const idKeys = isSpot(productType)
    ? ["traderUserId", "traderId", "uid", "userId"]
    : ["traderId", "traderUserId", "uid", "userId"];
  for (const key of idKeys) {
    const value = row[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return undefined;
}

function selectTrader(
  rows: Record<string, unknown>[],
  productType: string,
  selectionPolicy: string,
): { traderId: string; row: Record<string, unknown> } | null {
  const candidates = rows
    .map((row) => ({
      traderId: traderIdFromRow(row, productType),
      row,
      score: traderScore(row),
    }))
    .filter(
      (
        item,
      ): item is {
        traderId: string;
        row: Record<string, unknown>;
        score: number;
      } => Boolean(item.traderId),
    );
  if (candidates.length === 0) {
    return null;
  }
  if (selectionPolicy === "stable") {
    candidates.sort((a, b) => b.score - a.score || a.traderId.localeCompare(b.traderId));
  }
  const best = candidates[0];
  if (!best) {
    return null;
  }
  return {
    traderId: best.traderId,
    row: best.row,
  };
}

export function registerCopyTradingTools(): ToolSpec[] {
  return [
    {
      name: "copy_get_traders",
      module: "copytrading",
      description:
        "Get copy-trading trader list and configuration candidates. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: {
            type: "string",
            enum: [...COPY_PRODUCT_TYPES],
            description: "Copy trading market type.",
          },
          symbol: { type: "string", description: "Optional symbol filter for spot copy." },
          limit: { type: "number", description: "Page size, default 20." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = readString(args, "productType") ?? "USDT-FUTURES";
        assertEnum(productType, "productType", COPY_PRODUCT_TYPES);
        const symbol = readString(args, "symbol");
        const limit = readNumber(args, "limit");
        const path = isSpot(productType)
          ? "/api/v2/copy/spot-follower/query-traders"
          : "/api/v2/copy/mix-follower/query-traders";
        const query = isSpot(productType)
          ? compactObject({ symbol, limit })
          : compactObject({ productType, symbol, limit });
        const response = await context.client.privateGet(
          path,
          query,
          privateRateLimit("copy_get_traders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "copy_place_order",
      module: "copytrading",
      description:
        "Create or update copy-trading follow settings. [CAUTION] Changes copy-trading behavior. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...COPY_PRODUCT_TYPES] },
          traderId: {
            type: "string",
            description:
              "Required trader id. For spot copy this is traderUserId. For futures copy this is traderId.",
          },
          symbol: { type: "string", description: "Optional symbol for spot copy settings." },
          leverageType: {
            type: "string",
            enum: ["position", "contract"],
            description: "Futures copy leverage type. Default position.",
          },
          traceType: {
            type: "string",
            enum: ["amount", "ratio"],
            description: "Futures copy size mode. Default amount.",
          },
          marginType: {
            type: "string",
            enum: ["cross", "isolated"],
            description: "Futures margin type. Default cross.",
          },
          amount: {
            type: "string",
            description: "Trace amount (for amount mode).",
          },
          ratio: {
            type: "string",
            description: "Trace ratio (for ratio mode).",
          },
          autoSelectTrader: {
            type: "boolean",
            description:
              "When true (or traderId omitted), auto-select trader from query-traders list.",
          },
          selectionPolicy: {
            type: "string",
            enum: ["recommended", "stable"],
            description: "Trader auto-selection policy. Default recommended.",
          },
          dryRun: {
            type: "boolean",
            description:
              "When true, resolve trader and return payload preview without sending write request.",
          },
        },
        required: ["productType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = readString(args, "productType") ?? "USDT-FUTURES";
        assertEnum(productType, "productType", COPY_PRODUCT_TYPES);
        const requestedTraderId = readString(args, "traderId");
        const autoSelectTrader =
          readBoolean(args, "autoSelectTrader") ?? !requestedTraderId;
        const selectionPolicy = readString(args, "selectionPolicy") ?? "recommended";
        assertEnum(selectionPolicy, "selectionPolicy", ["recommended", "stable"]);
        const dryRun = readBoolean(args, "dryRun") ?? false;

        let resolvedTraderId = requestedTraderId;
        let selectedTrader: Record<string, unknown> | null = null;
        let candidateCount = 0;

        if (!resolvedTraderId && autoSelectTrader) {
          const tradersPath = isSpot(productType)
            ? "/api/v2/copy/spot-follower/query-traders"
            : "/api/v2/copy/mix-follower/query-traders";
          const tradersResponse = await context.client.privateGet(
            tradersPath,
            isSpot(productType)
              ? compactObject({
                  symbol: readString(args, "symbol"),
                  limit: 20,
                })
              : compactObject({
                  productType,
                  symbol: readString(args, "symbol"),
                  limit: 20,
                }),
            privateRateLimit("copy_place_order_select", 10),
          );
          const rows = extractTraderRows(tradersResponse.data);
          candidateCount = rows.length;
          const picked = selectTrader(rows, productType, selectionPolicy);
          if (!picked) {
            throw new BitgetApiError(
              "No available copy traders found for auto selection.",
              {
                code: "COPY_TRADER_NOT_FOUND",
                suggestion:
                  "Call copy_get_traders and pass traderId explicitly, or switch productType.",
              },
            );
          }
          resolvedTraderId = picked.traderId;
          selectedTrader = picked.row;
        }

        if (!resolvedTraderId) {
          throw new ValidationError(
            'Missing "traderId". Provide traderId or set autoSelectTrader=true.',
          );
        }

        if (isSpot(productType)) {
          const payload = compactObject({
            traderUserId: resolvedTraderId,
            symbol: readString(args, "symbol"),
          });
          if (dryRun) {
            return {
              endpoint: "DRY_RUN POST /api/v2/copy/spot-follower/settings",
              requestTime: new Date().toISOString(),
              data: {
                dryRun: true,
                payload,
                requestedTraderId: requestedTraderId ?? null,
                resolvedTraderId,
                autoSelected: !requestedTraderId,
                selectionPolicy,
                candidateCount,
                selectedTrader,
              },
            };
          }
          const response = await context.client.privatePost(
            "/api/v2/copy/spot-follower/settings",
            payload,
            privateRateLimit("copy_place_order", 10),
          );
          return {
            ...normalize(response),
            selection: {
              requestedTraderId: requestedTraderId ?? null,
              resolvedTraderId,
              autoSelected: !requestedTraderId,
              selectionPolicy,
              candidateCount,
              selectedTrader,
            },
          };
        }

        const symbol = readString(args, "symbol");
        if (!symbol) {
          throw new ValidationError(
            'Parameter "symbol" is required for futures copy settings.',
          );
        }

        const payload = {
          traderId: resolvedTraderId,
          productType,
          settings: [
            compactObject({
              traderId: resolvedTraderId,
              symbol,
              leverType: readString(args, "leverageType") ?? "position",
              traceType: readString(args, "traceType") ?? "amount",
              marginType: readString(args, "marginType") ?? "cross",
              amount: readString(args, "amount") ?? "10",
              ratio: readString(args, "ratio"),
            }),
          ],
        };
        if (dryRun) {
          return {
            endpoint: "DRY_RUN POST /api/v2/copy/mix-follower/settings",
            requestTime: new Date().toISOString(),
            data: {
              dryRun: true,
              payload,
              requestedTraderId: requestedTraderId ?? null,
              resolvedTraderId,
              autoSelected: !requestedTraderId,
              selectionPolicy,
              candidateCount,
              selectedTrader,
            },
          };
        }

        const response = await context.client.privatePost(
          "/api/v2/copy/mix-follower/settings",
          payload,
          privateRateLimit("copy_place_order", 10),
        );
        return {
          ...normalize(response),
          selection: {
            requestedTraderId: requestedTraderId ?? null,
            resolvedTraderId,
            autoSelected: !requestedTraderId,
            selectionPolicy,
            candidateCount,
            selectedTrader,
          },
        };
      },
    },
    {
      name: "copy_close_position",
      module: "copytrading",
      description:
        "Close copy-trading follower position (futures). [CAUTION] Closes positions. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string" },
          subPosId: {
            type: "string",
            description: "Tracking number (maps to trackingNo).",
          },
          marginCoin: { type: "string" },
          marginMode: { type: "string", enum: ["cross", "isolated"] },
          holdSide: { type: "string", enum: ["long", "short"] },
        },
        required: ["productType", "symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const response = await context.client.privatePost(
          "/api/v2/copy/mix-follower/close-positions",
          compactObject({
            productType,
            symbol: requireString(args, "symbol"),
            trackingNo: readString(args, "subPosId"),
            marginCoin: readString(args, "marginCoin"),
            marginMode: readString(args, "marginMode"),
            holdSide: readString(args, "holdSide"),
          }),
          privateRateLimit("copy_close_position", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "copy_get_orders",
      module: "copytrading",
      description:
        "Query copy-trading historical orders. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...COPY_PRODUCT_TYPES] },
          symbol: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          limit: { type: "number" },
          traderId: { type: "string", description: "Optional trader id filter." },
        },
        required: ["productType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        assertEnum(productType, "productType", COPY_PRODUCT_TYPES);
        const path = isSpot(productType)
          ? "/api/v2/copy/spot-follower/query-history-orders"
          : "/api/v2/copy/mix-follower/query-history-orders";
        const query = isSpot(productType)
          ? compactObject({
              symbol: readString(args, "symbol"),
              startTime: readString(args, "startTime"),
              endTime: readString(args, "endTime"),
              limit: readNumber(args, "limit"),
            })
          : compactObject({
              productType,
              symbol: readString(args, "symbol"),
              startTime: readString(args, "startTime"),
              endTime: readString(args, "endTime"),
              limit: readNumber(args, "limit"),
              traderId: readString(args, "traderId"),
            });
        const response = await context.client.privateGet(
          path,
          query,
          privateRateLimit("copy_get_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "copy_get_positions",
      module: "copytrading",
      description:
        "Get current or historical copy-trading positions/orders. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...COPY_PRODUCT_TYPES] },
          symbol: { type: "string" },
          history: { type: "boolean" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          limit: { type: "number" },
          traderId: { type: "string" },
        },
        required: ["productType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const history = readBoolean(args, "history") ?? false;
        assertEnum(productType, "productType", COPY_PRODUCT_TYPES);
        const path = isSpot(productType)
          ? history
            ? "/api/v2/copy/spot-follower/query-history-orders"
            : "/api/v2/copy/spot-follower/query-current-orders"
          : history
            ? "/api/v2/copy/mix-follower/query-history-orders"
            : "/api/v2/copy/mix-follower/query-current-orders";
        const query = isSpot(productType)
          ? compactObject({
              symbol: readString(args, "symbol"),
              startTime: readString(args, "startTime"),
              endTime: readString(args, "endTime"),
              limit: readNumber(args, "limit"),
            })
          : compactObject({
              productType,
              symbol: readString(args, "symbol"),
              startTime: readString(args, "startTime"),
              endTime: readString(args, "endTime"),
              limit: readNumber(args, "limit"),
              traderId: readString(args, "traderId"),
            });
        const response = await context.client.privateGet(
          path,
          query,
          privateRateLimit("copy_get_positions", 10),
        );
        return normalize(response);
      },
    },
  ];
}
