import type { RateLimitConfig } from "../utils/rate-limiter.js";

export type HttpMethod = "GET" | "POST";
export type EndpointAuth = "public" | "private";

export type QueryValue = unknown;
export type QueryParams = Record<string, QueryValue>;
export type JsonRecord = Record<string, unknown>;

export interface BitgetCredentials {
  apiKey: string;
  secretKey: string;
  passphrase: string;
}

export interface BitgetApiResponse<TData = unknown> {
  code: string;
  msg?: string;
  requestTime?: number;
  data?: TData;
  [key: string]: unknown;
}

export interface RequestConfig {
  method: HttpMethod;
  path: string;
  auth: EndpointAuth;
  query?: QueryParams;
  body?: JsonRecord | JsonRecord[];
  rateLimit?: RateLimitConfig;
}

export interface RequestResult<TData = unknown> {
  endpoint: string;
  requestTime: string;
  data: TData;
  raw: BitgetApiResponse<TData>;
}
