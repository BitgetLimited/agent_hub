import type { ToolSpec } from "./types.js";
import {
  asRecord,
  assertEnum,
  compactObject,
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

export function registerP2pTools(): ToolSpec[] {
  return [
    {
      name: "p2p_get_merchants",
      module: "p2p",
      description:
        "Get P2P merchant list or specific merchant details. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          merchantId: { type: "string" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const merchantId = readString(args, "merchantId");
        const path = merchantId
          ? "/api/v2/p2p/merchantInfo"
          : "/api/v2/p2p/merchantList";
        const response = await context.client.privateGet(
          path,
          compactObject({ merchantId }),
          privateRateLimit("p2p_get_merchants", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "p2p_get_orders",
      module: "p2p",
      description:
        "Get P2P order list or advertisement list. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["orders", "advertisements"],
            description: "orders(default) or advertisements.",
          },
          status: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const type = readString(args, "type") ?? "orders";
        assertEnum(type, "type", ["orders", "advertisements"]);
        const path =
          type === "advertisements"
            ? "/api/v2/p2p/advList"
            : "/api/v2/p2p/orderList";
        const response = await context.client.privateGet(
          path,
          compactObject({
            status: readString(args, "status"),
            startTime: readString(args, "startTime"),
            endTime: readString(args, "endTime"),
          }),
          privateRateLimit("p2p_get_orders", 10),
        );
        return normalize(response);
      },
    },
  ];
}
