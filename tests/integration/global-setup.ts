import { execSync } from "node:child_process";
import "dotenv/config";

/** Migrates the isolated test database once before integration tests run. */
export default function setup(): void {
  const testUrl = assertSafeTestDatabaseUrl(process.env.TEST_DATABASE_URL);
  // Call the local binary directly: `npx` adds a slow registry lookup.
  execSync("node_modules/.bin/prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "pipe",
  });
}

export function assertSafeTestDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error("TEST_DATABASE_URL must be set to run integration tests");
  }
  const databaseName = new URL(url).pathname.slice(1);
  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing to run integration tests against "${databaseName}": the test database name must end with _test`,
    );
  }
  return url;
}
