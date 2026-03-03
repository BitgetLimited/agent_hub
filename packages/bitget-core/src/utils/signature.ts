import { createHmac } from "node:crypto";

export function signBitgetPayload(payload: string, secretKey: string): string {
  return createHmac("sha256", secretKey).update(payload).digest("base64");
}
