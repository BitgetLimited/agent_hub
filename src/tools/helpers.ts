import { ValidationError } from "../utils/errors.js";

export function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function readString(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = args[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new ValidationError(`Parameter "${key}" must be a string.`);
  }
  return value;
}

export function readNumber(
  args: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = args[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ValidationError(`Parameter "${key}" must be a number.`);
  }
  return value;
}

export function readBoolean(
  args: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = args[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new ValidationError(`Parameter "${key}" must be a boolean.`);
  }
  return value;
}

export function readStringArray(
  args: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const value = args[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ValidationError(`Parameter "${key}" must be an array of strings.`);
  }
  return value;
}

export function readObjectArray(
  args: Record<string, unknown>,
  key: string,
): Record<string, unknown>[] | undefined {
  const value = args[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (
    !Array.isArray(value) ||
    value.some((item) => !item || typeof item !== "object" || Array.isArray(item))
  ) {
    throw new ValidationError(`Parameter "${key}" must be an array of objects.`);
  }
  return value as Record<string, unknown>[];
}

export function requireString(
  args: Record<string, unknown>,
  key: string,
): string {
  const value = readString(args, key);
  if (!value || value.length === 0) {
    throw new ValidationError(`Missing required parameter "${key}".`);
  }
  return value;
}

export function requireObjectArray(
  args: Record<string, unknown>,
  key: string,
): Record<string, unknown>[] {
  const value = readObjectArray(args, key);
  if (!value || value.length === 0) {
    throw new ValidationError(`Missing required non-empty array "${key}".`);
  }
  return value;
}

export function ensureOneOf(
  args: Record<string, unknown>,
  keys: string[],
  message: string,
): void {
  const hasAny = keys.some((key) => args[key] !== undefined && args[key] !== null);
  if (!hasAny) {
    throw new ValidationError(message);
  }
}

export function assertEnum(
  value: string | undefined,
  key: string,
  values: readonly string[],
): void {
  if (value === undefined) {
    return;
  }
  if (!values.includes(value)) {
    throw new ValidationError(
      `Parameter "${key}" must be one of: ${values.join(", ")}.`,
    );
  }
}

export function compactObject(
  object: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(object)) {
    if (value !== undefined && value !== null) {
      next[key] = value;
    }
  }
  return next;
}
