import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import type { BitgetConfig } from "./config.js";
import { BitgetRestClient } from "./client/rest-client.js";
import { MODULES, SERVER_NAME, SERVER_VERSION, type ModuleId } from "./constants.js";
import { getEarnCapabilityStatus, warmupEarnCapability } from "./tools/earn.js";
import { buildTools } from "./tools/index.js";
import { toMcpTool, type ToolSpec } from "./tools/types.js";
import { BitgetApiError, toToolErrorPayload } from "./utils/errors.js";

const SYSTEM_CAPABILITIES_TOOL_NAME = "system_get_capabilities";
const SYSTEM_CAPABILITIES_TOOL: Tool = {
  name: SYSTEM_CAPABILITIES_TOOL_NAME,
  description:
    "Return machine-readable server capabilities and module availability for agent planning.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

type ModuleCapabilityStatus =
  | "enabled"
  | "disabled"
  | "unsupported"
  | "requires_auth"
  | "unknown";

interface CapabilitySnapshot {
  readOnly: boolean;
  hasAuth: boolean;
  moduleAvailability: Record<
    ModuleId,
    {
      status: ModuleCapabilityStatus;
      reasonCode?: string;
    }
  >;
}

function buildCapabilitySnapshot(config: BitgetConfig): CapabilitySnapshot {
  const enabledModules = new Set(config.modules);
  const earnCapability = getEarnCapabilityStatus();
  const moduleAvailability = {} as CapabilitySnapshot["moduleAvailability"];

  for (const moduleId of MODULES) {
    if (!enabledModules.has(moduleId)) {
      moduleAvailability[moduleId] = {
        status: "disabled",
        reasonCode: "MODULE_FILTERED",
      };
      continue;
    }

    if (moduleId !== "earn") {
      moduleAvailability[moduleId] = { status: "enabled" };
      continue;
    }

    if (!config.hasAuth) {
      moduleAvailability[moduleId] = {
        status: "requires_auth",
        reasonCode: "AUTH_MISSING",
      };
      continue;
    }

    if (earnCapability === "unsupported") {
      moduleAvailability[moduleId] = {
        status: "unsupported",
        reasonCode: "EARN_UNAVAILABLE",
      };
      continue;
    }

    if (earnCapability === "supported") {
      moduleAvailability[moduleId] = { status: "enabled" };
      continue;
    }

    moduleAvailability[moduleId] = {
      status: "unknown",
      reasonCode: "CAPABILITY_PROBING",
    };
  }

  return {
    readOnly: config.readOnly,
    hasAuth: config.hasAuth,
    moduleAvailability,
  };
}

function successResult(
  toolName: string,
  data: unknown,
  capabilitySnapshot: CapabilitySnapshot,
): CallToolResult {
  const payload: Record<string, unknown> = {
    tool: toolName,
    ok: true,
    data,
    capabilities: capabilitySnapshot,
    timestamp: new Date().toISOString(),
  };
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

function errorResult(
  toolName: string,
  error: unknown,
  capabilitySnapshot: CapabilitySnapshot,
): CallToolResult {
  const payload = toToolErrorPayload(error);
  const structured: Record<string, unknown> = {
    tool: toolName,
    ...payload,
    capabilities: capabilitySnapshot,
  };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(structured, null, 2) }],
    structuredContent: structured,
  };
}

function unknownToolResult(
  toolName: string,
  capabilitySnapshot: CapabilitySnapshot,
): CallToolResult {
  return errorResult(
    toolName,
    new BitgetApiError(`Tool "${toolName}" is not available in this server session.`, {
      code: "TOOL_NOT_AVAILABLE",
      suggestion: "Call list_tools again and choose from currently available tools.",
    }),
    capabilitySnapshot,
  );
}

export function createServer(config: BitgetConfig): Server {
  const client = new BitgetRestClient(config);
  const tools = buildTools(config);
  const toolMap = new Map<string, ToolSpec>(tools.map((tool) => [tool.name, tool]));
  const hasEarnTools = tools.some((tool) => tool.module === "earn");
  let earnWarmupDone = false;
  const ensureEarnWarmupIfNeeded = async (): Promise<void> => {
    if (!hasEarnTools || !config.hasAuth || earnWarmupDone) {
      return;
    }
    earnWarmupDone = true;
    await warmupEarnCapability({ config, client });
  };
  const listVisibleTools = (): ToolSpec[] => {
    if (getEarnCapabilityStatus() !== "unsupported") {
      return tools;
    }
    return tools.filter((tool) => tool.module !== "earn");
  };

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    await ensureEarnWarmupIfNeeded();
    return {
      tools: [...listVisibleTools().map(toMcpTool), SYSTEM_CAPABILITIES_TOOL],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    await ensureEarnWarmupIfNeeded();
    if (toolName === SYSTEM_CAPABILITIES_TOOL_NAME) {
      const snapshot = buildCapabilitySnapshot(config);
      return successResult(
        toolName,
        {
          server: {
            name: SERVER_NAME,
            version: SERVER_VERSION,
          },
          capabilities: snapshot,
        },
        snapshot,
      );
    }
    const tool = toolMap.get(toolName);

    if (!tool) {
      return unknownToolResult(toolName, buildCapabilitySnapshot(config));
    }

    try {
      const response = await tool.handler(request.params.arguments ?? {}, {
        config,
        client,
      });
      return successResult(toolName, response, buildCapabilitySnapshot(config));
    } catch (error) {
      return errorResult(toolName, error, buildCapabilitySnapshot(config));
    }
  });

  return server;
}
