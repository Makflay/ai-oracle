import { env } from "./env.js";

export const config = Object.freeze({
  port: env.PORT,

  database: Object.freeze({
    url: env.DATABASE_URL,
  }),

  sources: Object.freeze({
    requestTimeoutMs: env.SOURCE_REQUEST_TIMEOUT_MS,
    requestLimit: env.SOURCE_REQUEST_LIMIT,
  }),
});

export type AppConfig = typeof config;
