import type { ToolSpec } from "./types.js";
import {
  asRecord,
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
import { privateRateLimit } from "./common.js";
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

export function registerSpotTradeTools(): ToolSpec[] {
  return [
    {
      name: "spot_place_order",
      module: "spot",
      description:
        "Place one or more spot orders. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description:
              "Array of order objects. Single order should still be passed as an array with one item.",
            items: {
              type: "object",
            },
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
            force:
              readString(order, "force") ??
              (orderType === "limit" ? "gtc" : undefined),
          });
        });
        const isSingle = orders.length === 1;
        const path = isSingle
          ? "/api/v2/spot/trade/place-order"
          : "/api/v2/spot/trade/batch-orders";
        const body = isSingle ? normalizedOrders[0] : { orderList: normalizedOrders };
        const response = await context.client.privatePost(
          path,
          body,
          privateRateLimit("spot_place_order", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_cancel_orders",
      module: "spot",
      description:
        "Cancel one or more spot orders by id, batch ids, or symbol-wide cancel. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair symbol." },
          orderId: { type: "string", description: "Single order id." },
          orderIds: {
            type: "array",
            description: "Multiple order ids. Max 50.",
            items: { type: "string" },
          },
          cancelAll: {
            type: "boolean",
            description: "If true, cancel all open orders for symbol.",
          },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const symbol = requireString(args, "symbol");
        const orderId = readString(args, "orderId");
        const orderIds = readStringArray(args, "orderIds");
        const cancelAll = readBoolean(args, "cancelAll");
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
              path: "/api/v2/spot/trade/cancel-order",
              body: { symbol, orderId },
            }
          : orderIds
            ? {
                path: "/api/v2/spot/trade/batch-cancel-order",
                body: { symbol, orderIds },
              }
            : cancelAll
              ? {
                  path: "/api/v2/spot/trade/cancel-symbol-order",
                  body: { symbol },
                }
              : {
                  path: "/api/v2/spot/trade/cancel-order",
                  body: { symbol },
                };
        const response = await context.client.privatePost(
          path,
          body,
          privateRateLimit("spot_cancel_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_modify_order",
      module: "spot",
      description:
        "Cancel and replace a spot order atomically. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair symbol." },
          orderId: { type: "string", description: "Original order id." },
          newPrice: { type: "string", description: "New price for limit order." },
          newSize: { type: "string", description: "New order size." },
          newClientOid: { type: "string", description: "New client order id." },
        },
        required: ["symbol", "orderId"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const newPrice = readString(args, "newPrice");
        const newSize = readString(args, "newSize");
        const newClientOid = readString(args, "newClientOid");
        if (!newPrice && !newSize && !newClientOid) {
          throw new ValidationError(
            'Provide at least one of "newPrice", "newSize", or "newClientOid".',
          );
        }
        const response = await context.client.privatePost(
          "/api/v2/spot/trade/cancel-replace-order",
          compactObject({
            symbol: requireString(args, "symbol"),
            orderId: requireString(args, "orderId"),
            price: newPrice,
            size: newSize,
            clientOid: newClientOid,
            force: "gtc",
          }),
          privateRateLimit("spot_modify_order", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_orders",
      module: "spot",
      description:
        "Query spot order detail, open orders, or history orders. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Specific order id." },
          symbol: { type: "string", description: "Trading pair filter." },
          status: {
            type: "string",
            enum: ["open", "history"],
            description: "open(default) or history.",
          },
          startTime: { type: "string", description: "Start time in milliseconds." },
          endTime: { type: "string", description: "End time in milliseconds." },
          limit: { type: "number", description: "Result size, default 100." },
          idLessThan: { type: "string", description: "Pagination cursor." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orderId = readString(args, "orderId");
        const symbol = readString(args, "symbol");
        const status = readString(args, "status") ?? "open";
        const startTime = readString(args, "startTime");
        const endTime = readString(args, "endTime");
        const limit = readNumber(args, "limit");
        const idLessThan = readString(args, "idLessThan");
        const route = orderId
          ? "/api/v2/spot/trade/orderInfo"
          : status === "history"
            ? "/api/v2/spot/trade/history-orders"
            : "/api/v2/spot/trade/unfilled-orders";
        const query = compactObject({
          orderId,
          symbol,
          startTime,
          endTime,
          limit,
          idLessThan,
        });
        const response = await context.client.privateGet(
          route,
          query,
          privateRateLimit("spot_get_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_fills",
      module: "spot",
      description:
        "Get spot fills for order execution details. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair symbol." },
          orderId: { type: "string", description: "Specific order id." },
          startTime: { type: "string", description: "Start time in milliseconds." },
          endTime: { type: "string", description: "End time in milliseconds." },
          limit: { type: "number", description: "Result size, default 100." },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v2/spot/trade/fills",
          compactObject({
            symbol: requireString(args, "symbol"),
            orderId: readString(args, "orderId"),
            startTime: readString(args, "startTime"),
            endTime: readString(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("spot_get_fills", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_place_plan_order",
      module: "spot",
      description:
        "Create or modify spot plan order (trigger order). Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "When provided, modify existing plan order." },
          symbol: { type: "string", description: "Trading pair symbol." },
          side: { type: "string", enum: ["buy", "sell"], description: "Order side." },
          triggerPrice: { type: "string", description: "Trigger price." },
          triggerType: {
            type: "string",
            enum: ["mark_price", "fill_price", "last_price"],
            description: "Trigger source.",
          },
          orderType: {
            type: "string",
            enum: ["limit", "market"],
            description: "Execution order type.",
          },
          price: { type: "string", description: "Execution price for limit orders." },
          size: { type: "string", description: "Order quantity." },
        },
        required: ["triggerPrice"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orderId = readString(args, "orderId");
        const path = orderId
          ? "/api/v2/spot/trade/modify-plan-order"
          : "/api/v2/spot/trade/place-plan-order";
        const response = await context.client.privatePost(
          path,
          compactObject({
            orderId,
            symbol: readString(args, "symbol"),
            side: readString(args, "side"),
            triggerPrice: requireString(args, "triggerPrice"),
            triggerType:
              readString(args, "triggerType") === "last_price"
                ? "fill_price"
                : (readString(args, "triggerType") ?? "fill_price"),
            orderType: readString(args, "orderType"),
            executePrice: readString(args, "price"),
            planType: "amount",
            size: readString(args, "size"),
          }),
          privateRateLimit("spot_place_plan_order", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_plan_orders",
      module: "spot",
      description:
        "Get current or historical spot plan orders. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair symbol." },
          status: {
            type: "string",
            enum: ["current", "history"],
            description: "current(default) or history.",
          },
          startTime: { type: "string", description: "Start time in milliseconds." },
          endTime: { type: "string", description: "End time in milliseconds." },
          limit: { type: "number", description: "Result size, default 100." },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const status = readString(args, "status") ?? "current";
        const path =
          status === "history"
            ? "/api/v2/spot/trade/history-plan-order"
            : "/api/v2/spot/trade/current-plan-order";
        const response = await context.client.privateGet(
          path,
          compactObject({
            symbol: requireString(args, "symbol"),
            startTime: readString(args, "startTime"),
            endTime: readString(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("spot_get_plan_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_cancel_plan_orders",
      module: "spot",
      description:
        "Cancel one or multiple spot plan orders. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Single plan order id." },
          orderIds: {
            type: "array",
            description: "Multiple plan order ids.",
            items: { type: "string" },
          },
          symbol: { type: "string", description: "Cancel all plan orders for symbol." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orderId = readString(args, "orderId");
        const orderIds = readStringArray(args, "orderIds");
        const symbol = readString(args, "symbol");
        ensureOneOf(
          args,
          ["orderId", "orderIds", "symbol"],
          'Provide one of "orderId", "orderIds", or "symbol".',
        );
        if (orderIds && orderIds.length > 50) {
          throw new ValidationError("orderIds supports at most 50 items.");
        }
        const path = orderId
          ? "/api/v2/spot/trade/cancel-plan-order"
          : "/api/v2/spot/trade/batch-cancel-plan-order";
        const body = compactObject({ orderId, orderIds, symbol });
        const response = await context.client.privatePost(
          path,
          body,
          privateRateLimit("spot_cancel_plan_orders", 10),
        );
        return normalize(response);
      },
    },
  ];
}
