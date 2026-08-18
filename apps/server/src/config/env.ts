import { loadEnvFile } from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));

function loadLocalEnvironment(): void {
  try {
    loadEnvFile(resolve(currentDir, "../../../../.env"));
  } catch (error: unknown) {
    const errorCode = (error as NodeJS.ErrnoException).code;

    if (errorCode !== "ENOENT") {
      throw error;
    }
  }
}

loadLocalEnvironment();

const environmentSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),

  DATABASE_URL: z.url(),

  SOURCE_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(100)
    .max(120_000)
    .default(10_000),

  SOURCE_REQUEST_LIMIT: z.coerce.number().int().min(1).max(1_000).default(100),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "environment";

      return `- ${path}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(`Invalid environment variables:\n${issues}`);
}

export type Environment = z.infer<typeof environmentSchema>;

export const env: Environment = result.data;
