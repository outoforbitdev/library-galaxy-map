import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    css: {
      include: /\.module\.css$/,
      modules: { classNameStrategy: "stable" },
    },
  },
});
