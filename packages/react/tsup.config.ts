import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  outExtension: ({ format }) =>
    format === "esm" ? { js: ".mjs" } : { js: ".cjs" },
  dts: { entry: { index: "src/index.ts" } },
  sourcemap: true,
  clean: true,
  target: "es2019",
  platform: "neutral",
  external: ["react", "webpage-section-tracker"],
  treeshake: true
});

