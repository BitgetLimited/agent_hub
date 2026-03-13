import { test, expect } from "vitest";
import { loadConfig, ConfigError } from "bitget-core";

test("loadConfig sets paperTrading=false by default", () => {
  const config = loadConfig({ modules: "spot", readOnly: false, paperTrading: false });
  expect(config.paperTrading).toBe(false);
});

test("loadConfig sets paperTrading=true when flag is true", () => {
  const config = loadConfig({ modules: "spot", readOnly: false, paperTrading: true });
  expect(config.paperTrading).toBe(true);
});

test("loadConfig throws when both paperTrading and readOnly are true", () => {
  expect(() =>
    loadConfig({ modules: "spot", readOnly: true, paperTrading: true })
  ).toThrow(ConfigError);
});
