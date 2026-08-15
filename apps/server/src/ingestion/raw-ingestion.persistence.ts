import type { RawIngestionRecord } from "./raw-ingestion.types.js";

export interface PersistedRawRecord {
  readonly id: string;
  readonly sourceKey: string;
  readonly entityId: string;
  readonly payload: unknown;
  readonly recordedAt: Date;
}

export interface RawPersistenceResult {
  readonly receivedCount: number;
  readonly createdCount: number;
  readonly duplicateCount: number;
  readonly records: readonly PersistedRawRecord[];
}

export interface RawIngestionPersistence {
  save(records: readonly RawIngestionRecord[]): Promise<RawPersistenceResult>;
}
