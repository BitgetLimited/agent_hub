export { BitgetRestClient } from "./client/rest-client.js";
export { buildTools } from "./tools/index.js";
export { loadConfig } from "./config.js";
export type { BitgetConfig, CliOptions } from "./config.js";
export type { ToolSpec, ToolContext } from "./tools/types.js";
export { toMcpTool } from "./tools/types.js";
export { SERVER_NAME, SERVER_VERSION, MODULES, DEFAULT_MODULES } from "./constants.js";
export type { ModuleId } from "./constants.js";
export {
  BitgetMcpError,
  BitgetApiError,
  ConfigError,
  ValidationError,
  RateLimitError,
  AuthenticationError,
  NetworkError,
  toToolErrorPayload,
} from "./utils/errors.js";
export { getEarnCapabilityStatus, warmupEarnCapability } from "./tools/earn.js";
