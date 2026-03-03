import { test, expect } from "vitest";
import { toToolErrorPayload, BitgetApiError, ConfigError, ValidationError } from "bitget-core";

test("toToolErrorPayload wraps BitgetApiError to nested shape", () => {
  const err = new BitgetApiError("Insufficient balance", { code: "40786" });
  const payload = toToolErrorPayload(err);
  expect(payload.ok).toBe(false);
  expect(payload.error.type).toBe("BitgetApiError");
  expect(payload.error.code).toBe("40786");
  expect(payload.error.message).toBe("Insufficient balance");
  expect(typeof payload.timestamp).toBe("string");
  // timestamp should be a valid ISO date string
  expect(() => new Date(payload.timestamp)).not.toThrow();
});

test("toToolErrorPayload wraps generic Error as InternalError", () => {
  const err = new Error("Something broke");
  const payload = toToolErrorPayload(err);
  expect(payload.ok).toBe(false);
  expect(payload.error.type).toBe("InternalError");
  expect(payload.error.message).toBe("Something broke");
});

test("toToolErrorPayload wraps ConfigError", () => {
  const err = new ConfigError("Missing credentials", "Set env vars");
  const payload = toToolErrorPayload(err);
  expect(payload.error.type).toBe("ConfigError");
  expect(payload.error.suggestion).toBe("Set env vars");
  expect(payload.error.message).toBe("Missing credentials");
});

test("toToolErrorPayload wraps ValidationError", () => {
  const err = new ValidationError("orders must be an array");
  const payload = toToolErrorPayload(err);
  expect(payload.error.type).toBe("ValidationError");
  expect(payload.error.message).toBe("orders must be an array");
});

test("toToolErrorPayload sets ok=false on all error types", () => {
  const errors = [
    new BitgetApiError("api error"),
    new ConfigError("config error"),
    new ValidationError("validation error"),
    new Error("generic error"),
  ];
  for (const err of errors) {
    expect(toToolErrorPayload(err).ok).toBe(false);
  }
});
