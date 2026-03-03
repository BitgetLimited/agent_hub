import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/bin/mock-server.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
});
