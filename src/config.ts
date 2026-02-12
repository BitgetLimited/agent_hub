import { DEFAULT_MODULES, MODULES, type ModuleId } from "./constants.js";
import { ConfigError } from "./utils/errors.js";

export interface CliOptions {
  modules?: string;
  readOnly: boolean;
}

export interface BitgetConfig {
  apiKey?: string;
  secretKey?: string;
  passphrase?: string;
  hasAuth: boolean;
  baseUrl: string;
  timeoutMs: number;
  modules: ModuleId[];
  readOnly: boolean;
}

function parseModuleList(rawModules?: string): ModuleId[] {
  if (!rawModules || rawModules.trim().length === 0) {
    return [...DEFAULT_MODULES];
  }

  const trimmed = rawModules.trim().toLowerCase();
  if (trimmed === "all") {
    return [...MODULES];
  }

  const requested = trimmed
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (requested.length === 0) {
    return [...DEFAULT_MODULES];
  }

  const deduped = new Set<ModuleId>();
  for (const moduleId of requested) {
    if (!MODULES.includes(moduleId as ModuleId)) {
      throw new ConfigError(
        `Unknown module "${moduleId}".`,
        `Use one of: ${MODULES.join(", ")} or "all".`,
      );
    }
    deduped.add(moduleId as ModuleId);
  }

  return Array.from(deduped);
}

function loadTimeoutMs(): number {
  const raw = process.env.BITGET_TIMEOUT_MS;
  if (!raw) {
    return 15_000;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ConfigError(
      `Invalid BITGET_TIMEOUT_MS value "${raw}".`,
      "Set BITGET_TIMEOUT_MS as a positive integer in milliseconds.",
    );
  }

  return Math.floor(parsed);
}

function loadBaseUrl(): string {
  const baseUrl = process.env.BITGET_API_BASE_URL?.trim() || "https://api.bitget.com";
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    throw new ConfigError(
      `Invalid BITGET_API_BASE_URL "${baseUrl}".`,
      "BITGET_API_BASE_URL must start with http:// or https://",
    );
  }
  return baseUrl.replace(/\/+$/, "");
}

export function loadConfig(cli: CliOptions): BitgetConfig {
  const apiKey = process.env.BITGET_API_KEY?.trim();
  const secretKey = process.env.BITGET_SECRET_KEY?.trim();
  const passphrase = process.env.BITGET_PASSPHRASE?.trim();

  const hasAuth = Boolean(apiKey && secretKey && passphrase);
  const partialAuth =
    Boolean(apiKey) || Boolean(secretKey) || Boolean(passphrase);

  if (partialAuth && !hasAuth) {
    throw new ConfigError(
      "Partial API credentials detected.",
      "Set BITGET_API_KEY, BITGET_SECRET_KEY and BITGET_PASSPHRASE together.",
    );
  }

  return {
    apiKey,
    secretKey,
    passphrase,
    hasAuth,
    baseUrl: loadBaseUrl(),
    timeoutMs: loadTimeoutMs(),
    modules: parseModuleList(cli.modules),
    readOnly: cli.readOnly,
  };
}
