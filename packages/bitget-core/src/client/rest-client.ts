import { signBitgetPayload } from "../utils/signature.js";
import {
  AuthenticationError,
  BitgetApiError,
  ConfigError,
  NetworkError,
} from "../utils/errors.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import type { BitgetConfig } from "../config.js";
import type {
  BitgetApiResponse,
  QueryParams,
  QueryValue,
  RequestConfig,
  RequestResult,
} from "./types.js";

function isDefined(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function stringifyQueryValue(value: QueryValue): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(",");
  }
  return String(value);
}

function buildQueryString(query?: QueryParams): string {
  if (!query) {
    return "";
  }

  const entries = Object.entries(query).filter(([, value]) => isDefined(value));
  if (entries.length === 0) {
    return "";
  }

  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    params.set(key, stringifyQueryValue(value));
  }
  return params.toString();
}

export class BitgetRestClient {
  private readonly config: BitgetConfig;
  private readonly rateLimiter = new RateLimiter();

  public constructor(config: BitgetConfig) {
    this.config = config;
  }

  public async publicGet<TData = unknown>(
    path: string,
    query?: QueryParams,
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({
      method: "GET",
      path,
      auth: "public",
      query,
      rateLimit,
    });
  }

  public async privateGet<TData = unknown>(
    path: string,
    query?: QueryParams,
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({
      method: "GET",
      path,
      auth: "private",
      query,
      rateLimit,
    });
  }

  public async privatePost<TData = unknown>(
    path: string,
    body?: RequestConfig["body"],
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({
      method: "POST",
      path,
      auth: "private",
      body,
      rateLimit,
    });
  }

  private async request<TData = unknown>(
    config: RequestConfig,
  ): Promise<RequestResult<TData>> {
    const queryString = buildQueryString(config.query);
    const endpoint = queryString.length > 0 ? `${config.path}?${queryString}` : config.path;
    const url = `${this.config.baseUrl}${endpoint}`;
    const bodyJson = config.body ? JSON.stringify(config.body) : "";
    const timestamp = Date.now().toString();

    if (config.rateLimit) {
      await this.rateLimiter.consume(config.rateLimit);
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
      locale: "en-US",
    });

    if (config.auth === "private") {
      if (!this.config.hasAuth) {
        throw new ConfigError(
          "Private endpoint requires API credentials.",
          "Configure BITGET_API_KEY, BITGET_SECRET_KEY and BITGET_PASSPHRASE.",
        );
      }

      if (!this.config.apiKey || !this.config.secretKey || !this.config.passphrase) {
        throw new ConfigError(
          "Invalid private API credentials state.",
          "Ensure all BITGET credentials are set.",
        );
      }

      const payload = `${timestamp}${config.method.toUpperCase()}${endpoint}${bodyJson}`;
      const signature = signBitgetPayload(payload, this.config.secretKey);
      headers.set("ACCESS-KEY", this.config.apiKey);
      headers.set("ACCESS-SIGN", signature);
      headers.set("ACCESS-PASSPHRASE", this.config.passphrase);
      headers.set("ACCESS-TIMESTAMP", timestamp);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: config.method,
        headers,
        body: config.method === "POST" ? bodyJson : undefined,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw new NetworkError(
        `Failed to call Bitget endpoint ${config.method} ${endpoint}.`,
        `${config.method} ${endpoint}`,
        error,
      );
    }

    const rawText = await response.text();
    let parsed: BitgetApiResponse<TData>;
    try {
      parsed = (rawText ? JSON.parse(rawText) : {}) as BitgetApiResponse<TData>;
    } catch (error) {
      if (!response.ok) {
        const messagePreview = rawText.slice(0, 160).replace(/\s+/g, " ").trim();
        throw new BitgetApiError(
          `HTTP ${response.status} from Bitget: ${messagePreview || "Non-JSON response body"}`,
          {
            code: String(response.status),
            endpoint: `${config.method} ${config.path}`,
            suggestion: "Verify endpoint path and request parameters.",
          },
        );
      }
      throw new NetworkError(
        `Bitget returned non-JSON response for ${config.method} ${endpoint}.`,
        `${config.method} ${endpoint}`,
        error,
      );
    }

    if (!response.ok) {
      throw new BitgetApiError(
        `HTTP ${response.status} from Bitget: ${parsed.msg ?? "Unknown error"}`,
        {
          code: String(response.status),
          endpoint: `${config.method} ${config.path}`,
          suggestion: "Retry later or verify endpoint parameters.",
        },
      );
    }

    const responseCode = parsed.code;
    if (responseCode && responseCode !== "00000") {
      const message = parsed.msg ?? "Bitget API request failed.";
      if (
        responseCode === "40017" ||
        responseCode === "40018" ||
        responseCode === "40036"
      ) {
        throw new AuthenticationError(message, "Check API key, secret, passphrase and permissions.", `${config.method} ${config.path}`);
      }

      throw new BitgetApiError(message, {
        code: responseCode,
        endpoint: `${config.method} ${config.path}`,
      });
    }

    return {
      endpoint: `${config.method} ${config.path}`,
      requestTime: new Date().toISOString(),
      data: (parsed.data ?? null) as TData,
      raw: parsed,
    };
  }
}
