export enum DataSourceErrorCode {
  Network = "network",
  Timeout = "timeout",
  RateLimit = "rate_limit",
  Unauthorized = "unauthorized",
  InvalidResponse = "invalid_response",
  Unknown = "unknown",
}

export interface DataSourceFetchOptions {
  readonly cursor?: string;
  readonly limit?: number;
  readonly signal?: AbortSignal;
}

export interface DataSourceError {
  readonly code: DataSourceErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly statusCode?: number;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface DataSourceSuccess<T> {
  readonly success: true;
  readonly items: readonly T[];
  readonly fetchedAt: string;
  readonly nextCursor?: string;
}

export interface DataSourceFailure {
  readonly success: false;
  readonly error: DataSourceError;
}

export type DataSourceResult<T> = DataSourceSuccess<T> | DataSourceFailure;
