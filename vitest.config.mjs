import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@": __dirname,
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.js"],
    setupFiles: ["./tests/setup/integration.setup.js"],
    testTimeout: 30000,
  },
});