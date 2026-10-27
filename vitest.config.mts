import "dotenv/config";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const emptyModule = fileURLToPath(new URL("./tests/empty-module.ts", import.meta.url));

// Fixed, test-only secret so session tests never depend on a developer's .env.
const TEST_SESSION_SECRET = "test-session-secret-not-used-anywhere-else-0123456789";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws outside a React Server Components bundle; tests run in plain Node.
    alias: { "server-only": emptyModule },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["{lib,prisma,app}/**/*.test.ts", "*.test.ts"],
          env: { SESSION_SECRET: TEST_SESSION_SECRET },
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: ["{app,components}/**/*.test.tsx"],
          setupFiles: ["./tests/setup-dom.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["./tests/integration/global-setup.ts"],
          // One shared test database: run files one at a time so truncation never races.
          fileParallelism: false,
          env: {
            NODE_ENV: "test",
            DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
            SESSION_SECRET: TEST_SESSION_SECRET,
          },
          testTimeout: 30_000,
        },
      },
    ],
  },
});
