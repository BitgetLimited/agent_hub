import type { ToolSpec } from "./types.js";
import {
  asRecord,
  assertEnum,
  compactObject,
  readNumber,
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

export function registerBrokerTools(): ToolSpec[] {
  return [
    {
      name: "broker_get_info",
      module: "broker",
      description:
        "Get broker account information and commission data. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/api/v2/broker/account/info",
          undefined,
          privateRateLimit("broker_get_info", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "broker_manage_subaccounts",
      module: "broker",
      description:
        "Create, modify, or list broker subaccounts. Private endpoint. Rate limit: 5 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "modify", "list"] },
          subAccountUid: { type: "string" },
          subAccountName: { type: "string" },
          remark: { type: "string" },
          limit: { type: "number" },
        },
        required: ["action"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const action = requireString(args, "action");
        assertEnum(action, "action", ["create", "modify", "list"]);
        const payload = compactObject({
          subAccountUid: readString(args, "subAccountUid"),
          subAccountName: readString(args, "subAccountName"),
          remark: readString(args, "remark"),
          limit: readNumber(args, "limit"),
        });
        if (action === "list") {
          const response = await context.client.privateGet(
            "/api/v2/broker/account/subaccount-list",
            payload,
            privateRateLimit("broker_manage_subaccounts", 5),
          );
          return normalize(response);
        }
        const endpoint =
          action === "create"
            ? "/api/v2/broker/account/create-subaccount"
            : "/api/v2/broker/account/modify-subaccount";
        const response = await context.client.privatePost(
          endpoint,
          payload,
          privateRateLimit("broker_manage_subaccounts", 5),
        );
        return normalize(response);
      },
    },
    {
      name: "broker_manage_apikeys",
      module: "broker",
      description:
        "Create, modify, or list API keys for broker subaccounts. Private endpoint. Rate limit: 5 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "modify", "list"] },
          subAccountUid: { type: "string" },
          apiKeyPermissions: { type: "string" },
          apiKeyIp: { type: "string" },
          apiKeyPassphrase: { type: "string" },
        },
        required: ["action", "subAccountUid"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const action = requireString(args, "action");
        const subAccountUid = requireString(args, "subAccountUid");
        assertEnum(action, "action", ["create", "modify", "list"]);
        const payload = compactObject({
          subAccountUid,
          apiKeyPermissions: readString(args, "apiKeyPermissions"),
          apiKeyIp: readString(args, "apiKeyIp"),
          apiKeyPassphrase: readString(args, "apiKeyPassphrase"),
        });
        if (action === "list") {
          const response = await context.client.privateGet(
            "/api/v2/broker/account/subaccount-apikey-list",
            payload,
            privateRateLimit("broker_manage_apikeys", 5),
          );
          return normalize(response);
        }
        const endpoint =
          action === "create"
            ? "/api/v2/broker/account/create-subaccount-apikey"
            : "/api/v2/broker/account/modify-subaccount-apikey";
        const response = await context.client.privatePost(
          endpoint,
          payload,
          privateRateLimit("broker_manage_apikeys", 5),
        );
        return normalize(response);
      },
    },
  ];
}
