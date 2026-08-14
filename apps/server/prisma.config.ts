import { loadEnvFile } from "node:process";
import { defineConfig, env } from "prisma/config";

function loadLocalEnvironment(): void {
  try {
    loadEnvFile();
  } catch (error: unknown) {
    const errorCode = (error as NodeJS.ErrnoException).code;

    if (errorCode !== "ENOENT") {
      throw error;
    }
  }
}

loadLocalEnvironment();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
