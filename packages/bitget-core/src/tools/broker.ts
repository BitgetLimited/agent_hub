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
          permList: { type: "array", items: { type: "string" } },
          status: { type: "string" },
          limit: { type: "number" },
          idLessThan: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
        },
        required: ["action"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const action = requireString(args, "action");
        assertEnum(action, "action", ["create", "modify", "list"]);
        if (action === "list") {
          const payload = compactObject({
            limit: readNumber(args, "limit"),
            idLessThan: readString(args, "idLessThan"),
            status: readString(args, "status"),
            startTime: readString(args, "startTime"),
            endTime: readString(args, "endTime"),
          });
          const response = await context.client.privateGet(
            "/api/v2/broker/account/subaccount-list",
            payload,
            privateRateLimit("broker_manage_subaccounts", 5),
          );
          return normalize(response);
        }
        if (action === "create") {
          const payload = compactObject({
            subaccountName: readString(args, "subAccountName"),
          });
          const response = await context.client.privatePost(
            "/api/v2/broker/account/create-subaccount",
            payload,
            privateRateLimit("broker_manage_subaccounts", 5),
          );
          return normalize(response);
        }
        // modify
        const permList = args["permList"];
        const payload = compactObject({
          subUid: requireString(args, "subAccountUid"),
          status: readString(args, "status"),
          permList: Array.isArray(permList) ? permList : undefined,
        });
        const response = await context.client.privatePost(
          "/api/v2/broker/account/modify-subaccount",
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
        "Create, modify, list, or delete API keys for broker subaccounts. Private endpoint. Rate limit: 5 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "modify", "list", "delete"] },
          subAccountUid: { type: "string" },
          apiKeyPermissions: { type: "string" },
          apiKeyIp: { type: "string" },
          apiKeyPassphrase: { type: "string" },
          label: { type: "string" },
          permType: { type: "string" },
          apiKey: { type: "string" },
        },
        required: ["action", "subAccountUid"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const action = requireString(args, "action");
        const subUid = requireString(args, "subAccountUid");
        assertEnum(action, "action", ["create", "modify", "list", "delete"]);
        const apiKeyPermissions = readString(args, "apiKeyPermissions");
        const apiKeyIp = readString(args, "apiKeyIp");
        const apiKeyPassphrase = readString(args, "apiKeyPassphrase");
        const label = readString(args, "label");
        const permType = readString(args, "permType");
        const apiKey = readString(args, "apiKey");
        if (action === "list") {
          const response = await context.client.privateGet(
            "/api/v2/broker/manage/subaccount-apikey-list",
            compactObject({ subUid }),
            privateRateLimit("broker_manage_apikeys", 5),
          );
          return normalize(response);
        }
        if (action === "delete") {
          const response = await context.client.privatePost(
            "/api/v2/broker/manage/delete-subaccount-apikey",
            compactObject({ subUid, apiKey }),
            privateRateLimit("broker_manage_apikeys", 5),
          );
          return normalize(response);
        }
        const endpoint =
          action === "create"
            ? "/api/v2/broker/manage/create-subaccount-apikey"
            : "/api/v2/broker/manage/modify-subaccount-apikey";
        const payload = compactObject({
          subUid,
          passphrase: apiKeyPassphrase,
          label,
          permType,
          ipList: apiKeyIp ? [apiKeyIp] : undefined,
          permList: apiKeyPermissions ? [apiKeyPermissions] : undefined,
          apiKey,
        });
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
