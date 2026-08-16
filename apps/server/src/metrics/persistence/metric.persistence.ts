import type { MetricType } from "@ai-oracle/shared";

export interface MetricPersistenceRecord {
  readonly rawRecordId: string;
  readonly entityId: string;
  readonly metricType: MetricType;
  readonly value: number;
  readonly normalizedValue: number;
  readonly recordedAt: Date;
}

export interface PersistedMetricRecord {
  readonly id: string;
  readonly rawRecordId: string;
  readonly entityId: string;
  readonly sourceKey: string;
  readonly metricType: MetricType;
  readonly value: number;
  readonly normalizedValue: number;
  readonly recordedAt: Date;
}

export interface MetricPersistenceResult {
  readonly receivedCount: number;
  readonly createdCount: number;
  readonly duplicateCount: number;
  readonly records: readonly PersistedMetricRecord[];
}

export interface MetricPersistence {
  save(
    records: readonly MetricPersistenceRecord[],
  ): Promise<MetricPersistenceResult>;
}

export interface FindMetricHistoryInput {
  readonly entityId: string;
  readonly observedFrom: Date;
  readonly observedTo: Date;
}

export interface MetricHistoryRepository {
  findHistory(
    input: FindMetricHistoryInput,
  ): Promise<readonly PersistedMetricRecord[]>;
}
