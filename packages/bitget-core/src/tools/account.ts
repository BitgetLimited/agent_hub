import type { ToolSpec } from "./types.js";
import {
  asRecord,
  assertEnum,
  compactObject,
  readNumber,
  readString,
  requireString,
} from "./helpers.js";
import { privateRateLimit, PRODUCT_TYPES } from "./common.js";

function toApiTransferType(accountType: string): string {
  // Bitget transfer API uses p2p naming for funding wallet.
  return accountType === "funding" ? "p2p" : accountType;
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

export function registerAccountTools(): ToolSpec[] {
  return [
    {
      name: "get_account_assets",
      module: "account",
      description:
        "Get spot/futures/funding/all account balances. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          accountType: {
            type: "string",
            enum: ["spot", "futures", "funding", "all"],
            description: "Target account type. Default all.",
          },
          coin: { type: "string", description: "Optional coin filter." },
          productType: {
            type: "string",
            enum: [...PRODUCT_TYPES],
            description: "Required when accountType=futures.",
          },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const accountType = readString(args, "accountType") ?? "all";
        assertEnum(accountType, "accountType", ["spot", "futures", "funding", "all"]);
        const coin = readString(args, "coin");
        const productType = readString(args, "productType");
        if (productType) {
          assertEnum(productType, "productType", PRODUCT_TYPES);
        }
        const route =
          accountType === "spot"
            ? "/api/v2/spot/account/assets"
            : accountType === "futures"
              ? "/api/v2/mix/account/accounts"
              : accountType === "funding"
                ? "/api/v2/account/funding-assets"
                : "/api/v2/account/all-account-balance";
        const response = await context.client.privateGet(
          route,
          compactObject({ coin, productType }),
          privateRateLimit("get_account_assets", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "get_account_bills",
      module: "account",
      description:
        "Get account bill records for spot or futures account. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          accountType: { type: "string", enum: ["spot", "futures"] },
          coin: { type: "string" },
          productType: { type: "string", enum: [...PRODUCT_TYPES] },
          businessType: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          limit: { type: "number" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const accountType = readString(args, "accountType") ?? "spot";
        assertEnum(accountType, "accountType", ["spot", "futures"]);
        const productType = readString(args, "productType");
        if (productType) {
          assertEnum(productType, "productType", PRODUCT_TYPES);
        }
        const route =
          accountType === "futures"
            ? "/api/v2/mix/account/bill"
            : "/api/v2/spot/account/bills";
        const response = await context.client.privateGet(
          route,
          compactObject({
            coin: readString(args, "coin"),
            productType,
            businessType: readString(args, "businessType"),
            startTime: readString(args, "startTime"),
            endTime: readString(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("get_account_bills", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "transfer",
      module: "account",
      description:
        "Transfer funds between accounts or sub-account. [CAUTION] Moves funds. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          fromAccountType: { type: "string" },
          toAccountType: { type: "string" },
          coin: { type: "string" },
          amount: { type: "string" },
          subAccountUid: { type: "string" },
          symbol: { type: "string" },
          clientOid: { type: "string" },
        },
        required: ["fromAccountType", "toAccountType", "coin", "amount"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const subAccountUid = readString(args, "subAccountUid");
        const path = subAccountUid
          ? "/api/v2/spot/wallet/subaccount-transfer"
          : "/api/v2/spot/wallet/transfer";
        const response = await context.client.privatePost(
          path,
          compactObject({
            fromType: toApiTransferType(requireString(args, "fromAccountType")),
            toType: toApiTransferType(requireString(args, "toAccountType")),
            coin: requireString(args, "coin"),
            amount: requireString(args, "amount"),
            symbol: readString(args, "symbol"),
            clientOid: readString(args, "clientOid"),
            subAccountUid,
          }),
          privateRateLimit("transfer", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "withdraw",
      module: "account",
      description:
        "Withdraw funds to external address. [DANGER] Irreversible fund movement. Private endpoint. Rate limit: 1 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          coin: { type: "string" },
          transferType: { type: "string", enum: ["on_chain", "internal_transfer"] },
          address: { type: "string" },
          chain: { type: "string" },
          amount: { type: "string" },
          tag: { type: "string" },
          clientOid: { type: "string" },
        },
        required: ["coin", "transferType", "address", "amount"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const transferType = requireString(args, "transferType");
        assertEnum(transferType, "transferType", ["on_chain", "internal_transfer"]);
        const response = await context.client.privatePost(
          "/api/v2/spot/wallet/withdrawal",
          compactObject({
            coin: requireString(args, "coin"),
            transferType,
            address: requireString(args, "address"),
            chain: readString(args, "chain"),
            amount: requireString(args, "amount"),
            tag: readString(args, "tag"),
            clientOid: readString(args, "clientOid"),
          }),
          privateRateLimit("withdraw", 1),
        );
        return normalize(response);
      },
    },
    {
      name: "cancel_withdrawal",
      module: "account",
      description:
        "Cancel pending withdrawal request by order id. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Withdrawal order id." },
        },
        required: ["orderId"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v2/spot/wallet/cancel-withdrawal",
          { orderId: requireString(args, "orderId") },
          privateRateLimit("cancel_withdrawal", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "get_deposit_address",
      module: "account",
      description:
        "Get deposit address for coin and optional chain. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          coin: { type: "string" },
          chain: { type: "string" },
        },
        required: ["coin"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v2/spot/wallet/deposit-address",
          compactObject({
            coin: requireString(args, "coin"),
            chain: readString(args, "chain"),
          }),
          privateRateLimit("get_deposit_address", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "get_transaction_records",
      module: "account",
      description:
        "Get deposit, withdrawal, or transfer records. Private endpoint. Rate limit: 10 req/s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          recordType: {
            type: "string",
            enum: ["deposit", "withdrawal", "transfer"],
          },
          coin: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          limit: { type: "number" },
          orderId: { type: "string" },
        },
        required: ["recordType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const recordType = requireString(args, "recordType");
        assertEnum(recordType, "recordType", ["deposit", "withdrawal", "transfer"]);
        const now = Date.now();
        const defaultStartTime = String(now - 30 * 24 * 60 * 60 * 1000);
        const defaultEndTime = String(now);
        const path =
          recordType === "deposit"
            ? "/api/v2/spot/wallet/deposit-records"
            : recordType === "withdrawal"
              ? "/api/v2/spot/wallet/withdrawal-records"
              : "/api/v2/spot/account/sub-main-trans-record";
        const startTime = readString(args, "startTime");
        const endTime = readString(args, "endTime");
        const response = await context.client.privateGet(
          path,
          compactObject({
            coin: readString(args, "coin"),
            startTime:
              recordType === "deposit" || recordType === "transfer"
                ? (startTime ?? defaultStartTime)
                : startTime,
            endTime:
              recordType === "deposit" || recordType === "transfer"
                ? (endTime ?? defaultEndTime)
                : endTime,
            limit: readNumber(args, "limit"),
            orderId: readString(args, "orderId"),
          }),
          privateRateLimit("get_transaction_records", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "manage_subaccounts",
      module: "account",
      description:
        "Create, modify, list subaccounts and manage subaccount API keys. [CAUTION] Account management operation. Private endpoint. Rate limit: 5 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "create",
              "modify",
              "list",
              "createApiKey",
              "modifyApiKey",
              "listApiKeys",
            ],
          },
          subAccountName: { type: "string" },
          subAccountUid: { type: "string" },
          remark: { type: "string" },
          apiKeyPermissions: { type: "string" },
          apiKeyIp: { type: "string" },
          apiKeyPassphrase: { type: "string" },
        },
        required: ["action"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const action = requireString(args, "action");
        assertEnum(action, "action", [
          "create",
          "modify",
          "list",
          "createApiKey",
          "modifyApiKey",
          "listApiKeys",
        ]);
        const common = compactObject({
          subAccountName: readString(args, "subAccountName"),
          subAccountUid: readString(args, "subAccountUid"),
          remark: readString(args, "remark"),
          apiKeyPermissions: readString(args, "apiKeyPermissions"),
          apiKeyIp: readString(args, "apiKeyIp"),
          apiKeyPassphrase: readString(args, "apiKeyPassphrase"),
        });

        if (action === "list") {
          const response = await context.client.privateGet(
            "/api/v2/user/virtual-subaccount-list",
            common,
            privateRateLimit("manage_subaccounts", 5),
          );
          return normalize(response);
        }

        if (action === "listApiKeys") {
          const response = await context.client.privateGet(
            "/api/v2/user/virtual-subaccount-apikey-list",
            common,
            privateRateLimit("manage_subaccounts", 5),
          );
          return normalize(response);
        }

        const endpoint =
          action === "create"
            ? "/api/v2/user/create-virtual-subaccount"
            : action === "modify"
              ? "/api/v2/user/modify-virtual-subaccount"
              : action === "createApiKey"
                ? "/api/v2/user/create-virtual-subaccount-apikey"
                : "/api/v2/user/modify-virtual-subaccount-apikey";
        const response = await context.client.privatePost(
          endpoint,
          common,
          privateRateLimit("manage_subaccounts", 5),
        );
        return normalize(response);
      },
    },
  ];
}
