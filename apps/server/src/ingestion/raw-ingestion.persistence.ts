import type { RawIngestionRecord } from "./raw-ingestion.types.js";

export interface RawPersistenceResult {
  readonly receivedCount: number;
  readonly createdCount: number;
  readonly duplicateCount: number;
}

export interface RawIngestionPersistence {
  save(records: readonly RawIngestionRecord[]): Promise<RawPersistenceResult>;
}
