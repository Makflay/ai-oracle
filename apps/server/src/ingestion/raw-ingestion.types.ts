import type { DataSource } from "../sources/index.js";
import type { DataSourceError } from "../sources/index.js";

export type EntitySourceRegistry = Readonly<
  Record<string, readonly DataSource<unknown>[]>
>;

export interface RawIngestionOptions {
  readonly limit?: number;
  readonly signal?: AbortSignal;
}

export interface RawIngestionRecord<TPayload = unknown> {
  readonly source: string;
  readonly entity: string;
  readonly payload: TPayload;
  readonly fetchedAt: string;
}

export interface RawIngestionFailure {
  readonly source: string;
  readonly entity: string;
  readonly error: DataSourceError;
}

export interface RawIngestionResult {
  readonly records: readonly RawIngestionRecord[];
  readonly failures: readonly RawIngestionFailure[];
}
