import type { ToolSpec } from "./types.js";
import {
  asRecord,
  assertEnum,
  compactObject,
  ensureOneOf,
  readNumber,
  readString,
  readStringArray,
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

export function registerConvertTools(): ToolSpec[] {
  return [
    {
      name: "convert_get_quote",
      module: "convert",
      description:
        "Get supported convert currencies or quoted conversion price. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          fromCoin: { type: "string" },
          toCoin: { type: "string" },
          fromCoinAmount: { type: "string" },
          toCoinAmount: { type: "string" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const fromCoin = readString(args, "fromCoin");
        const path = fromCoin
          ? "/api/v2/convert/quoted-price"
          : "/api/v2/convert/currencies";
        const fromCoinSize = readString(args, "fromCoinAmount");
        const toCoinSize = readString(args, "toCoinAmount");
        if (fromCoin && toCoinSize && fromCoinSize) {
          throw new ValidationError(
            'Provide only one of "fromCoinAmount" or "toCoinAmount".',
          );
        }
        const response = await context.client.privateGet(
          path,
          compactObject({
            fromCoin,
            toCoin: readString(args, "toCoin"),
            fromCoinSize,
            toCoinSize,
          }),
          privateRateLimit("convert_get_quote", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "convert_execute",
      module: "convert",
      description:
        "Execute normal conversion or BGB small balance sweep. [CAUTION] Converts funds. Private endpoint. Rate limit: 5 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["normal", "bgb"] },
          fromCoin: { type: "string" },
          toCoin: { type: "string" },
          fromCoinAmount: { type: "string" },
          toCoinAmount: { type: "string" },
          traceId: { type: "string" },
          coinList: { type: "array", items: { type: "string" } },
        },
        required: ["fromCoin", "toCoin"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const type = readString(args, "type") ?? "normal";
        assertEnum(type, "type", ["normal", "bgb"]);
        const path =
          type === "bgb"
            ? "/api/v2/convert/bgb-convert"
            : "/api/v2/convert/trade";

        if (type === "bgb") {
          const response = await context.client.privatePost(
            path,
            compactObject({
              coinList: readStringArray(args, "coinList"),
              traceId: readString(args, "traceId") ?? `mcp-${Date.now()}`,
            }),
            privateRateLimit("convert_execute", 5),
          );
          return normalize(response);
        }

        ensureOneOf(
          args,
          ["fromCoinAmount", "toCoinAmount"],
          'Provide one of "fromCoinAmount" or "toCoinAmount" for normal conversion.',
        );
        const fromCoin = requireString(args, "fromCoin");
        const toCoin = requireString(args, "toCoin");
        const fromCoinSize = readString(args, "fromCoinAmount");
        const toCoinSize = readString(args, "toCoinAmount");
        if (fromCoinSize && toCoinSize) {
          throw new ValidationError(
            'Provide only one of "fromCoinAmount" or "toCoinAmount".',
          );
        }

        const quoted = await context.client.privateGet<{
          fromCoin: string;
          fromCoinSize: string;
          toCoin: string;
          toCoinSize: string;
          cnvtPrice: string;
          traceId: string;
        }>(
          "/api/v2/convert/quoted-price",
          compactObject({ fromCoin, toCoin, fromCoinSize, toCoinSize }),
          privateRateLimit("convert_execute_quote", 10),
        );
        const quoteData = quoted.data;
        const response = await context.client.privatePost(
          path,
          compactObject({
            fromCoin: quoteData.fromCoin,
            toCoin: quoteData.toCoin,
            fromCoinSize: quoteData.fromCoinSize,
            toCoinSize: quoteData.toCoinSize,
            cnvtPrice: quoteData.cnvtPrice,
            traceId: quoteData.traceId,
          }),
          privateRateLimit("convert_execute", 5),
        );
        return normalize(response);
      },
    },
    {
      name: "convert_get_history",
      module: "convert",
      description:
        "Get conversion or BGB sweep history. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["normal", "bgb"] },
          startTime: { type: "string" },
          endTime: { type: "string" },
          limit: { type: "number" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const type = readString(args, "type") ?? "normal";
        assertEnum(type, "type", ["normal", "bgb"]);
        const now = Date.now();
        const defaultStartTime = String(now - 7 * 24 * 60 * 60 * 1000);
        const defaultEndTime = String(now);
        const path =
          type === "bgb"
            ? "/api/v2/convert/bgb-convert-records"
            : "/api/v2/convert/convert-record";
        const response = await context.client.privateGet(
          path,
          compactObject({
            startTime:
              type === "normal"
                ? (readString(args, "startTime") ?? defaultStartTime)
                : readString(args, "startTime"),
            endTime:
              type === "normal"
                ? (readString(args, "endTime") ?? defaultEndTime)
                : readString(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("convert_get_history", 10),
        );
        return normalize(response);
      },
    },
  ];
}
