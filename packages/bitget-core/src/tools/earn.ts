import type { ToolContext, ToolSpec } from "./types.js";
import {
  asRecord,
  assertEnum,
  compactObject,
  readString,
  requireString,
} from "./helpers.js";
import { privateRateLimit } from "./common.js";
import type { RequestResult } from "../client/types.js";
import { BitgetApiError } from "../utils/errors.js";

type EarnOperation = "products" | "holdings" | "subscribe" | "redeem";
export type EarnCapabilityStatus = "unknown" | "supported" | "unsupported";

const EARN_ENDPOINTS: Record<EarnOperation, string[]> = {
  products: ["/api/v2/earn/product/list", "/api/v2/earn/saving/product/list"],
  holdings: ["/api/v2/earn/holding/list", "/api/v2/earn/saving/holding/list"],
  subscribe: ["/api/v2/earn/subscribe"],
  redeem: ["/api/v2/earn/redeem"],
};

const earnEndpointCache: Partial<Record<EarnOperation, string>> = {};
let earnCapability: EarnCapabilityStatus = "unknown";

export function getEarnCapabilityStatus(): EarnCapabilityStatus {
  return earnCapability;
}

export async function warmupEarnCapability(context: ToolContext): Promise<EarnCapabilityStatus> {
  if (earnCapability !== "unknown") {
    return earnCapability;
  }
  try {
    await ensureEarnSupported(context);
  } catch {
    // warmup is best-effort; status transition is handled in ensureEarnSupported.
  }
  return earnCapability;
}

function is404Error(error: unknown): boolean {
  return error instanceof BitgetApiError && error.code === "404";
}

function earnUnavailableError(operation: EarnOperation): BitgetApiError {
  return new BitgetApiError(
    `Earn API operation "${operation}" is unavailable in current account/region or API environment.`,
    {
      code: "EARN_UNAVAILABLE",
      suggestion:
        "Current Bitget environment does not expose earn endpoints for this account. Consider disabling earn module for this deployment.",
    },
  );
}

function endpointCandidates(operation: EarnOperation): string[] {
  const cached = earnEndpointCache[operation];
  if (!cached) {
    return [...EARN_ENDPOINTS[operation]];
  }
  return [cached, ...EARN_ENDPOINTS[operation].filter((item) => item !== cached)];
}

async function callEarnGet(
  context: ToolContext,
  operation: EarnOperation,
  query: Record<string, unknown>,
  rateLimitKey: string,
): Promise<RequestResult> {
  for (const path of endpointCandidates(operation)) {
    try {
      const response = await context.client.privateGet(
        path,
        query,
        privateRateLimit(rateLimitKey, 10),
      );
      earnEndpointCache[operation] = path;
      return response;
    } catch (error) {
      if (is404Error(error)) {
        continue;
      }
      throw error;
    }
  }
  throw earnUnavailableError(operation);
}

async function callEarnPost(
  context: ToolContext,
  operation: EarnOperation,
  body: Record<string, unknown>,
  rateLimitKey: string,
): Promise<RequestResult> {
  for (const path of endpointCandidates(operation)) {
    try {
      const response = await context.client.privatePost(
        path,
        body,
        privateRateLimit(rateLimitKey, 5),
      );
      earnEndpointCache[operation] = path;
      return response;
    } catch (error) {
      if (is404Error(error)) {
        continue;
      }
      throw error;
    }
  }
  throw earnUnavailableError(operation);
}

async function ensureEarnSupported(context: ToolContext): Promise<void> {
  if (earnCapability === "supported") {
    return;
  }
  if (earnCapability === "unsupported") {
    throw earnUnavailableError("products");
  }
  try {
    await callEarnGet(
      context,
      "products",
      compactObject({
        coin: "USDT",
      }),
      "earn_probe",
    );
    earnCapability = "supported";
  } catch (error) {
    if (error instanceof BitgetApiError && error.code === "EARN_UNAVAILABLE") {
      earnCapability = "unsupported";
    }
    throw error;
  }
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

export function registerEarnTools(): ToolSpec[] {
  return [
    {
      name: "earn_get_products",
      module: "earn",
      description:
        "Query available earn products such as savings and staking. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          coin: { type: "string" },
          productType: { type: "string" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        await ensureEarnSupported(context);
        const response = await callEarnGet(
          context,
          "products",
          compactObject({
            coin: readString(args, "coin"),
            productType: readString(args, "productType"),
          }),
          "earn_get_products",
        );
        return normalize(response);
      },
    },
    {
      name: "earn_subscribe_redeem",
      module: "earn",
      description:
        "Subscribe or redeem earn products. [CAUTION] Locks/releases funds. Private endpoint. Rate limit: 5 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["subscribe", "redeem"] },
          productId: { type: "string" },
          amount: { type: "string" },
          coin: { type: "string" },
        },
        required: ["action", "productId", "amount", "coin"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const action = requireString(args, "action");
        assertEnum(action, "action", ["subscribe", "redeem"]);
        await ensureEarnSupported(context);
        const operation = action === "subscribe" ? "subscribe" : "redeem";
        const response = await callEarnPost(
          context,
          operation,
          {
            productId: requireString(args, "productId"),
            amount: requireString(args, "amount"),
            coin: requireString(args, "coin"),
          },
          "earn_subscribe_redeem",
        );
        return normalize(response);
      },
    },
    {
      name: "earn_get_holdings",
      module: "earn",
      description:
        "Get current earn holdings and earnings records. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          coin: { type: "string" },
          productId: { type: "string" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        await ensureEarnSupported(context);
        const response = await callEarnGet(
          context,
          "holdings",
          compactObject({
            coin: readString(args, "coin"),
            productId: readString(args, "productId"),
          }),
          "earn_get_holdings",
        );
        return normalize(response);
      },
    },
  ];
}
