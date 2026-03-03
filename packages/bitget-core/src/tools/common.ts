import type { RateLimitConfig } from "../utils/rate-limiter.js";

export const PRODUCT_TYPES = [
  "USDT-FUTURES",
  "USDC-FUTURES",
  "COIN-FUTURES",
] as const;

export const GRANULARITIES = [
  "1min",
  "5min",
  "15min",
  "30min",
  "1h",
  "4h",
  "6h",
  "12h",
  "1day",
  "3day",
  "1week",
  "1M",
] as const;

export function publicRateLimit(key: string, rps = 20): RateLimitConfig {
  return {
    key: `public:${key}`,
    capacity: rps,
    refillPerSecond: rps,
  };
}

export function privateRateLimit(key: string, rps = 10): RateLimitConfig {
  return {
    key: `private:${key}`,
    capacity: rps,
    refillPerSecond: rps,
  };
}
