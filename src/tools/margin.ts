import type { ToolSpec } from "./types.js";
import {
  asRecord,
  assertEnum,
  compactObject,
  ensureOneOf,
  readBoolean,
  readNumber,
  readString,
  readStringArray,
  requireString,
} from "./helpers.js";
import { privateRateLimit } from "./common.js";
import { ValidationError } from "../utils/errors.js";

const MARGIN_TYPES = ["crossed", "isolated"] as const;

function marginPath(marginType: string, suffix: string): string {
  const scope = marginType === "crossed" ? "crossed" : "isolated";
  return `/api/v2/margin/${scope}/${suffix}`;
}

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

export function registerMarginTools(): ToolSpec[] {
  return [
    {
      name: "margin_get_assets",
      module: "margin",
      description:
        "Get crossed or isolated margin assets and risk metrics. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          marginType: { type: "string", enum: [...MARGIN_TYPES] },
          symbol: { type: "string" },
          coin: { type: "string" },
        },
        required: ["marginType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const marginType = requireString(args, "marginType");
        assertEnum(marginType, "marginType", MARGIN_TYPES);
        const response = await context.client.privateGet(
          marginPath(marginType, "account/assets"),
          compactObject({
            symbol: readString(args, "symbol"),
            coin: readString(args, "coin"),
          }),
          privateRateLimit("margin_get_assets", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "margin_borrow",
      module: "margin",
      description:
        "Borrow margin funds. [CAUTION] Creates debt. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          marginType: { type: "string", enum: [...MARGIN_TYPES] },
          coin: { type: "string" },
          amount: { type: "string" },
          symbol: { type: "string" },
        },
        required: ["marginType", "coin", "amount"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const marginType = requireString(args, "marginType");
        assertEnum(marginType, "marginType", MARGIN_TYPES);
        const response = await context.client.privatePost(
          marginPath(marginType, "account/borrow"),
          compactObject({
            coin: requireString(args, "coin"),
            borrowAmount: requireString(args, "amount"),
            symbol: readString(args, "symbol"),
          }),
          privateRateLimit("margin_borrow", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "margin_repay",
      module: "margin",
      description:
        "Repay margin debt with optional flash repay. [CAUTION] Uses account funds. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          marginType: { type: "string", enum: [...MARGIN_TYPES] },
          coin: { type: "string" },
          amount: { type: "string" },
          symbol: { type: "string" },
          flashRepay: { type: "boolean" },
        },
        required: ["marginType", "coin"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const marginType = requireString(args, "marginType");
        const flashRepay = readBoolean(args, "flashRepay") ?? false;
        assertEnum(marginType, "marginType", MARGIN_TYPES);
        const path = flashRepay
          ? marginPath(marginType, "account/flash-repay")
          : marginPath(marginType, "account/repay");
        const response = await context.client.privatePost(
          path,
          compactObject({
            coin: requireString(args, "coin"),
            repayAmount: readString(args, "amount"),
            symbol: readString(args, "symbol"),
          }),
          privateRateLimit("margin_repay", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "margin_place_order",
      module: "margin",
      description:
        "Place margin order in crossed or isolated mode. [CAUTION] Executes real trade. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          marginType: { type: "string", enum: [...MARGIN_TYPES] },
          symbol: { type: "string" },
          side: { type: "string", enum: ["buy", "sell"] },
          orderType: { type: "string", enum: ["limit", "market"] },
          price: { type: "string" },
          size: { type: "string" },
          loanType: {
            type: "string",
            enum: ["normal", "autoLoan", "autoRepay", "autoLoanAndRepay"],
          },
        },
        required: ["marginType", "symbol", "side", "orderType", "size"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const marginType = requireString(args, "marginType");
        assertEnum(marginType, "marginType", MARGIN_TYPES);
        const response = await context.client.privatePost(
          marginPath(marginType, "place-order"),
          compactObject({
            symbol: requireString(args, "symbol"),
            side: requireString(args, "side"),
            orderType: requireString(args, "orderType"),
            price: readString(args, "price"),
            baseSize: requireString(args, "size"),
            loanType: readString(args, "loanType") ?? "normal",
            force: "gtc",
          }),
          privateRateLimit("margin_place_order", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "margin_cancel_orders",
      module: "margin",
      description:
        "Cancel one or more margin orders. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          marginType: { type: "string", enum: [...MARGIN_TYPES] },
          symbol: { type: "string" },
          orderId: { type: "string" },
          orderIds: { type: "array", items: { type: "string" } },
        },
        required: ["marginType", "symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const marginType = requireString(args, "marginType");
        const symbol = requireString(args, "symbol");
        assertEnum(marginType, "marginType", MARGIN_TYPES);
        ensureOneOf(
          args,
          ["orderId", "orderIds"],
          'Provide one of "orderId" or "orderIds".',
        );
        const orderId = readString(args, "orderId");
        const orderIds = readStringArray(args, "orderIds");
        if (orderIds && orderIds.length > 50) {
          throw new ValidationError("orderIds supports at most 50 items.");
        }
        const path = orderId
          ? marginPath(marginType, "cancel-order")
          : marginPath(marginType, "batch-cancel-order");
        const response = await context.client.privatePost(
          path,
          orderId
            ? compactObject({ symbol, orderId })
            : {
                symbol,
                orderIdList: (orderIds ?? []).map((id) => ({ orderId: id })),
              },
          privateRateLimit("margin_cancel_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "margin_get_orders",
      module: "margin",
      description:
        "Query margin orders (open/history/order detail). Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          marginType: { type: "string", enum: [...MARGIN_TYPES] },
          symbol: { type: "string" },
          orderId: { type: "string" },
          status: { type: "string", enum: ["open", "history"] },
          startTime: { type: "string" },
          endTime: { type: "string" },
          limit: { type: "number" },
        },
        required: ["marginType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const marginType = requireString(args, "marginType");
        assertEnum(marginType, "marginType", MARGIN_TYPES);
        const orderId = readString(args, "orderId");
        const status = readString(args, "status") ?? "open";
        const path =
          status === "history" || orderId
            ? marginPath(marginType, "history-orders")
            : marginPath(marginType, "open-orders");
        const response = await context.client.privateGet(
          path,
          compactObject({
            symbol: readString(args, "symbol"),
            orderId,
            startTime: readString(args, "startTime"),
            endTime: readString(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("margin_get_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "margin_get_records",
      module: "margin",
      description:
        "Get borrow/repay/interest/liquidation records for margin accounts. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          marginType: { type: "string", enum: [...MARGIN_TYPES] },
          recordType: {
            type: "string",
            enum: ["borrow", "repay", "interest", "liquidation"],
          },
          coin: { type: "string" },
          symbol: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          limit: { type: "number" },
        },
        required: ["marginType", "recordType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const marginType = requireString(args, "marginType");
        const recordType = requireString(args, "recordType");
        assertEnum(marginType, "marginType", MARGIN_TYPES);
        assertEnum(recordType, "recordType", [
          "borrow",
          "repay",
          "interest",
          "liquidation",
        ]);
        const apiMarginType =
          recordType === "borrow"
            ? "borrow"
            : recordType === "repay"
              ? "repay"
              : recordType === "interest"
                ? "interest"
                : "liquidation_fee";
        const now = Date.now();
        const defaultStartTime = String(now - 30 * 24 * 60 * 60 * 1000);
        const response = await context.client.privateGet(
          marginPath(marginType, "financial-records"),
          compactObject({
            marginType: apiMarginType,
            coin: readString(args, "coin"),
            startTime: readString(args, "startTime") ?? defaultStartTime,
            endTime: readString(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("margin_get_records", 10),
        );
        return normalize(response);
      },
    },
  ];
}
