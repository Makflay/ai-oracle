export interface MetricSourceRecord {
  readonly rawRecordId: string;
  readonly sourceKey: string;
  readonly entityId: string;
  readonly payload: unknown;
  readonly recordedAt: Date;
}
