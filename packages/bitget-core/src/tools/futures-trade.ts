import type { ToolSpec } from "./types.js";
import {
  asRecord,
  assertEnum,
  compactObject,
  ensureOneOf,
  readBoolean,
  readNumber,
  readObjectArray,
  readString,
  readStringArray,
  requireObjectArray,
  requireString,
} from "./helpers.js";
import { privateRateLimit, PRODUCT_TYPES } from "./common.js";
import { ValidationError } from "../utils/errors.js";

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

export function registerFuturesTradeTools(): ToolSpec[] {
  return [
    {
      name: "futures_place_order",
      module: "futures",
      description:
        "Place one or more futures orders with optional TP/SL. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "Array of futures order objects.",
            items: { type: "object" },
          },
        },
        required: ["orders"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orders = requireObjectArray(args, "orders");
        if (orders.length > 50) {
          throw new ValidationError("orders supports at most 50 items.");
        }
        const normalizedOrders = orders.map((order) => {
          const orderType = readString(order, "orderType");
          return compactObject({
            ...order,
            marginMode: readString(order, "marginMode") ?? "crossed",
            force:
              readString(order, "force") ??
              (orderType === "limit" ? "gtc" : undefined),
          });
        });
        const isSingle = orders.length === 1;
        const path = isSingle
          ? "/api/v2/mix/order/place-order"
          : "/api/v2/mix/order/batch-place-order";
        const first = normalizedOrders.at(0);
        if (!first) {
          throw new ValidationError("orders cannot be empty.");
        }
        let body: Record<string, unknown>;
        if (isSingle) {
          body = first;
        } else {
          const shared = {
            symbol: readString(first, "symbol"),
            productType: readString(first, "productType"),
            marginCoin: readString(first, "marginCoin"),
            marginMode: readString(first, "marginMode") ?? "crossed",
          };
          const isSameKey = normalizedOrders.every(
            (order) =>
              readString(order, "symbol") === shared.symbol &&
              readString(order, "productType") === shared.productType &&
              readString(order, "marginCoin") === shared.marginCoin &&
              (readString(order, "marginMode") ?? "crossed") ===
                shared.marginMode,
          );
          if (!isSameKey) {
            throw new ValidationError(
              "Batch futures orders must share symbol, productType, marginCoin, and marginMode.",
            );
          }
          body = {
            symbol: shared.symbol,
            productType: shared.productType,
            marginCoin: shared.marginCoin,
            marginMode: shared.marginMode,
            orderList: normalizedOrders.map((order) => {
              const { symbol, productType, marginCoin, marginMode, ...rest } = order;
              void symbol;
              void productType;
              void marginCoin;
              void marginMode;
              return rest;
            }),
          };
        }
        const response = await context.client.privatePost(
          path,
          body,
          privateRateLimit("futures_place_order", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_cancel_orders",
      module: "futures",
      description:
        "Cancel futures orders by order id, batch ids, or cancel-all mode. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string" },
          orderId: { type: "string" },
          orderIds: { type: "array", items: { type: "string" } },
          cancelAll: { type: "boolean" },
          marginCoin: { type: "string" },
        },
        required: ["productType", "symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const symbol = requireString(args, "symbol");
        const orderId = readString(args, "orderId");
        const orderIds = readStringArray(args, "orderIds");
        const cancelAll = readBoolean(args, "cancelAll");
        const marginCoin = readString(args, "marginCoin");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        ensureOneOf(
          args,
          ["orderId", "orderIds", "cancelAll"],
          'Provide one of "orderId", "orderIds", or "cancelAll=true".',
        );
        if (orderIds && orderIds.length > 50) {
          throw new ValidationError("orderIds supports at most 50 items.");
        }
        const { path, body } = orderId
          ? {
              path: "/api/v2/mix/order/cancel-order",
              body: { productType, symbol, orderId },
            }
          : orderIds
            ? {
                path: "/api/v2/mix/order/batch-cancel-orders",
                body: { productType, symbol, orderIds },
              }
            : {
                path: "/api/v2/mix/order/cancel-all-orders",
                body: compactObject({ productType, symbol, marginCoin }),
              };
        const response = await context.client.privatePost(
          path,
          body,
          privateRateLimit("futures_cancel_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_orders",
      module: "futures",
      description:
        "Query futures orders by id, open status, or history. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          orderId: { type: "string" },
          symbol: { type: "string" },
          status: { type: "string", enum: ["open", "history"] },
          startTime: { type: "string" },
          endTime: { type: "string" },
          limit: { type: "number" },
        },
        required: ["productType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const orderId = readString(args, "orderId");
        const symbol = readString(args, "symbol");
        const status = readString(args, "status") ?? "open";
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const path = orderId
          ? "/api/v2/mix/order/detail"
          : status === "history"
            ? "/api/v2/mix/order/orders-history"
            : "/api/v2/mix/order/orders-pending";
        const query = compactObject({
          productType,
          orderId,
          symbol,
          startTime: readString(args, "startTime"),
          endTime: readString(args, "endTime"),
          limit: readNumber(args, "limit"),
        });
        const response = await context.client.privateGet(
          path,
          query,
          privateRateLimit("futures_get_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_fills",
      module: "futures",
      description:
        "Get futures fills and fill history records. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string" },
          orderId: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          limit: { type: "number" },
        },
        required: ["productType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const startTime = readString(args, "startTime");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const path = startTime
          ? "/api/v2/mix/order/fill-history"
          : "/api/v2/mix/order/fills";
        const response = await context.client.privateGet(
          path,
          compactObject({
            productType,
            symbol: readString(args, "symbol"),
            orderId: readString(args, "orderId"),
            startTime,
            endTime: readString(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("futures_get_fills", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_positions",
      module: "futures",
      description:
        "Get current or historical futures positions. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string" },
          marginCoin: { type: "string" },
          history: { type: "boolean" },
        },
        required: ["productType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const symbol = readString(args, "symbol");
        const history = readBoolean(args, "history") ?? false;
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const path = history
          ? "/api/v2/mix/position/history-position"
          : symbol
            ? "/api/v2/mix/position/single-position"
            : "/api/v2/mix/position/all-position";
        const response = await context.client.privateGet(
          path,
          compactObject({
            productType,
            symbol,
            marginCoin:
              readString(args, "marginCoin") ?? (symbol ? "USDT" : undefined),
          }),
          privateRateLimit("futures_get_positions", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_set_leverage",
      module: "futures",
      description:
        "Set futures leverage for symbol and margin coin. [CAUTION] Affects risk exposure. Private endpoint. Rate limit: 5 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string" },
          marginCoin: { type: "string" },
          leverage: { type: "string" },
          holdSide: { type: "string", enum: ["long", "short"] },
        },
        required: ["productType", "symbol", "marginCoin", "leverage"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        const response = await context.client.privatePost(
          "/api/v2/mix/account/set-leverage",
          compactObject({
            productType,
            symbol: requireString(args, "symbol"),
            marginCoin: requireString(args, "marginCoin"),
            leverage: requireString(args, "leverage"),
            holdSide: readString(args, "holdSide"),
          }),
          privateRateLimit("futures_set_leverage", 5),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_update_config",
      module: "futures",
      description:
        "Update futures margin mode, position mode, or auto-margin setting. [CAUTION] Affects trading behavior. Private endpoint. Rate limit: 5 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          symbol: { type: "string" },
          marginCoin: { type: "string" },
          setting: {
            type: "string",
            enum: ["marginMode", "positionMode", "autoMargin"],
          },
          value: { type: "string" },
          holdSide: { type: "string", enum: ["long", "short"] },
        },
        required: ["productType", "symbol", "marginCoin", "setting", "value"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productType = requireString(args, "productType");
        const setting = requireString(args, "setting");
        assertEnum(productType, "productType", PRODUCT_TYPES);
        assertEnum(setting, "setting", ["marginMode", "positionMode", "autoMargin"]);
        const endpoint =
          setting === "marginMode"
            ? "/api/v2/mix/account/set-margin-mode"
            : setting === "positionMode"
              ? "/api/v2/mix/account/set-position-mode"
              : "/api/v2/mix/account/set-auto-margin";
        const response = await context.client.privatePost(
          endpoint,
          setting === "marginMode"
            ? compactObject({
                productType,
                symbol: requireString(args, "symbol"),
                marginCoin: requireString(args, "marginCoin"),
                marginMode: requireString(args, "value"),
              })
            : setting === "positionMode"
              ? compactObject({
                  productType,
                  symbol: requireString(args, "symbol"),
                  marginCoin: requireString(args, "marginCoin"),
                  posMode: requireString(args, "value"),
                })
              : compactObject({
                  productType,
                  symbol: requireString(args, "symbol"),
                  marginCoin: requireString(args, "marginCoin"),
                  autoMargin: requireString(args, "value"),
                  holdSide: readString(args, "holdSide"),
                }),
          privateRateLimit("futures_update_config", 5),
        );
        return normalize(response);
      },
    },
  ];
}
