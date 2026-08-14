import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

const currentDir = dirname(fileURLToPath(import.meta.url));

function loadLocalEnvironment(): void {
  try {
    loadEnvFile(resolve(currentDir, "../../.env"));
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
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
