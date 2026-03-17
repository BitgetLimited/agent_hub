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
          symbol: { type: "string", description: "Required for isolated margin." },
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
            symbol: marginType === "isolated"
              ? requireString(args, "symbol")
              : readString(args, "symbol"),
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
        "Repay margin debt with optional flash repay. [CAUTION] Uses account funds. Private endpoint. Rate limit: 10 req/s per UID. For flash repay, coin is optional (omit to repay all). For isolated flash repay, symbol filters which pairs to repay.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          marginType: { type: "string", enum: [...MARGIN_TYPES] },
          coin: { type: "string", description: "Required for regular repay. Optional for flash repay (omit to repay all)." },
          amount: { type: "string", description: "Required for regular repay." },
          symbol: { type: "string", description: "Required for isolated regular repay. Optional for isolated flash repay." },
          flashRepay: { type: "boolean" },
        },
        required: ["marginType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const marginType = requireString(args, "marginType");
        const flashRepay = readBoolean(args, "flashRepay") ?? false;
        assertEnum(marginType, "marginType", MARGIN_TYPES);

        let body: Record<string, unknown>;

        if (flashRepay) {
          if (marginType === "isolated") {
            // Flash isolated: optional symbolList
            const symbol = readString(args, "symbol");
            body = compactObject({
              symbolList: symbol ? [symbol] : undefined,
            });
          } else {
            // Flash crossed: coin is optional (omit = full account repay)
            body = compactObject({
              coin: readString(args, "coin"),
            });
          }
        } else {
          if (marginType === "isolated") {
            // Regular isolated: repayAmount and symbol are required
            body = compactObject({
              coin: requireString(args, "coin"),
              repayAmount: requireString(args, "amount"),
              symbol: requireString(args, "symbol"),
            });
          } else {
            // Regular crossed: repayAmount is required
            body = compactObject({
              coin: requireString(args, "coin"),
              repayAmount: requireString(args, "amount"),
            });
          }
        }

        const path = flashRepay
          ? marginPath(marginType, "account/flash-repay")
          : marginPath(marginType, "account/repay");
        const response = await context.client.privatePost(
          path,
          body,
          privateRateLimit("margin_repay", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "margin_place_order",
      module: "margin",
      description:
        "Place margin order in crossed or isolated mode. [CAUTION] Executes real trade. Private endpoint. Rate limit: 10 req/s per UID. For market buy orders, use quoteSize (quote currency amount) instead of size.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          marginType: { type: "string", enum: [...MARGIN_TYPES] },
          symbol: { type: "string" },
          side: { type: "string", enum: ["buy", "sell"] },
          orderType: { type: "string", enum: ["limit", "market"] },
          price: { type: "string" },
          size: { type: "string", description: "Base currency size. For market buy, use quoteSize instead." },
          quoteSize: { type: "string", description: "Quote currency size. Required for market buy orders." },
          loanType: {
            type: "string",
            enum: ["normal", "autoLoan", "autoRepay", "autoLoanAndRepay"],
          },
        },
        required: ["marginType", "symbol", "side", "orderType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const marginType = requireString(args, "marginType");
        assertEnum(marginType, "marginType", MARGIN_TYPES);
        const orderType = requireString(args, "orderType");
        const side = requireString(args, "side");
        const isMarketBuy = orderType === "market" && side === "buy";
        const response = await context.client.privatePost(
          marginPath(marginType, "place-order"),
          compactObject({
            symbol: requireString(args, "symbol"),
            side,
            orderType,
            price: readString(args, "price"),
            baseSize: isMarketBuy ? undefined : requireString(args, "size"),
            quoteSize: isMarketBuy ? requireString(args, "quoteSize") : readString(args, "quoteSize"),
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
        "Query margin orders (open/history/order detail). Private endpoint. Rate limit: 10 req/s per UID. Note: symbol and startTime are required by the API for open-orders queries.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          marginType: { type: "string", enum: [...MARGIN_TYPES] },
          symbol: { type: "string", description: "Required for open-orders queries per API docs." },
          orderId: { type: "string" },
          status: { type: "string", enum: ["open", "history"] },
          startTime: { type: "string", description: "Required for open-orders queries per API docs." },
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
        const recordTypeSuffixMap: Record<string, string> = {
          borrow: "borrow-history",
          repay: "repay-history",
          interest: "interest-history",
          liquidation: "liquidation-history",
        };
        const suffix = recordTypeSuffixMap[recordType];
        const now = Date.now();
        const defaultStartTime = String(now - 30 * 24 * 60 * 60 * 1000);
        const response = await context.client.privateGet(
          marginPath(marginType, suffix),
          compactObject({
            coin: readString(args, "coin"),
            symbol: readString(args, "symbol"),
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
