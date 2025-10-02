// tsup.config.ts
import { defineConfig } from "tsup";

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig([
  // (A) 라이브러리: ESM/CJS + 타입
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    outExtension: ({ format }) =>
      format === "esm" ? { js: ".mjs" } : { js: ".cjs" },
    dts: { entry: { index: "src/index.ts" } },
    sourcemap: !isProduction,
    minify: isProduction,
    clean: true,
    target: "es2019",
    platform: "neutral",
    esbuildOptions: (options) => {
      if (isProduction) {
        options.drop = ['console', 'debugger'];
      }
    },
  },

  // (B) 브라우저 IIFE: 전역 바인딩 전용
  {
    entry: { "index.iife": "src/browser.ts" },
    format: ["iife"],
    outExtension: () => ({ js: ".js" }),
    dts: false,
    sourcemap: !isProduction,
    minify: isProduction,
    target: "es2019",
    platform: "browser",
    globalName: "StlTracker",
    splitting: false,
    treeshake: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    esbuildOptions: (options) => {
      if (isProduction) {
        options.drop = ['console', 'debugger'];
      }
    },
    noExternal: [/^./], // 외부 의존도 모두 번들
  },
]);