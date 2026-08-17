import { ApiStatus } from "@ai-oracle/shared";

import { createApiUrl } from "./apiConfig";

interface ApiErrorPayload<TCode extends string> {
  status: ApiStatus.Error;
  error: {
    code: TCode;
    message: string;
  };
}

interface ApiSuccessPayload {
  status: ApiStatus.Success;
  data: unknown;
}

export class ApiClientError<TCode extends string = string> extends Error {
  readonly statusCode: number;
  readonly code: TCode | null;

  constructor(options: {
    message: string;
    statusCode: number;
    code?: TCode | null;
  }) {
    super(options.message);

    this.name = "ApiClientError";
    this.statusCode = options.statusCode;
    this.code = options.code ?? null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSuccessPayload(value: unknown): value is ApiSuccessPayload {
  return (
    isRecord(value) &&
    value.status === ApiStatus.Success &&
    Object.hasOwn(value, "data")
  );
}

function isErrorPayload<TCode extends string>(
  value: unknown,
): value is ApiErrorPayload<TCode> {
  if (
    !isRecord(value) ||
    value.status !== ApiStatus.Error ||
    !isRecord(value.error)
  ) {
    return false;
  }

  return (
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest<TData, TErrorCode extends string = string>(
  path: string,
  init?: RequestInit,
): Promise<TData> {
  const response = await fetch(createApiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    if (isErrorPayload<TErrorCode>(body)) {
      throw new ApiClientError<TErrorCode>({
        message: body.error.message,
        statusCode: response.status,
        code: body.error.code,
      });
    }

    throw new ApiClientError<TErrorCode>({
      message: `API request failed with status ${response.status}`,
      statusCode: response.status,
    });
  }

  if (!isSuccessPayload(body)) {
    throw new ApiClientError<TErrorCode>({
      message: "API returned an invalid success response",
      statusCode: response.status,
    });
  }

  return body.data as TData;
}
