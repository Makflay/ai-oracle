import { ApiStatus } from "@ai-oracle/shared";

import type { ApiErrorResponse } from "@ai-oracle/shared";

import type { ErrorRequestHandler } from "express";

const INTERNAL_ERROR_CODE = "INTERNAL_ERROR";

export const apiErrorHandler: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next,
): void => {
  console.error(`[API] ${request.method} ${request.originalUrl}`, error);

  const body: ApiErrorResponse = {
    status: ApiStatus.Error,
    error: {
      code: INTERNAL_ERROR_CODE,
      message: "Unable to process the request",
    },
  };

  response.status(500).json(body);
};
