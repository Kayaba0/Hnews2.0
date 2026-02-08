import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["server/routes.ts"],
  outDir: "build/server",
  format: ["esm"],
  platform: "node",
  target: "node20",
  bundle: true,
  splitting: false,
  clean: true,
  sourcemap: false,
  dts: false
});
