import type { MetricType } from "@ai-oracle/shared";

import { RawIngestionOrchestrator } from "../ingestion/index.js";

import type {
  MetricSourceRecord,
  PersistedMetricRecord,
} from "../metrics/index.js";

import { MetricProcessingService } from "../metrics/index.js";

import type {
  ActualForecastMetric,
  ActualMetricsResult,
  CollectActualMetricsInput,
  MissingActualMetric,
} from "./actual-metrics.types.js";

const createMetricKey = (sourceKey: string, metricType: MetricType): string =>
  `${sourceKey}:${metricType}`;

export class ActualMetricsService {
  constructor(
    private readonly ingestion: RawIngestionOrchestrator,
    private readonly metrics: MetricProcessingService,
  ) {}

  async collect(
    input: CollectActualMetricsInput,
  ): Promise<ActualMetricsResult> {
    const { target } = input;

    if (target.factors.length === 0) {
      throw new Error(`Target "${target.forecastId}" has no factors`);
    }

    const ingestionResult = await this.ingestion.ingest(
      target.entitySlug,
      input.ingestionOptions,
    );

    const unexpectedEntity = ingestionResult.persistence.records.some(
      (record) => record.entityId !== target.entityId,
    );

    if (unexpectedEntity) {
      throw new Error(
        "Evaluation ingestion returned records for an unexpected entity",
      );
    }

    const sourceRecords: readonly MetricSourceRecord[] =
      ingestionResult.persistence.records.map((record) => ({
        rawRecordId: record.id,
        sourceKey: record.sourceKey,
        entityId: record.entityId,
        payload: record.payload,
        recordedAt: record.recordedAt,
      }));

    const metricResult = await this.metrics.process(sourceRecords);

    const latestMetrics = this.selectLatestMetrics(metricResult.records);

    const actualMetrics: ActualForecastMetric[] = [];

    const missingMetrics: MissingActualMetric[] = [];

    for (const factor of target.factors) {
      const key = createMetricKey(factor.sourceKey, factor.metricType);

      const actualMetric = latestMetrics.get(key);

      if (!actualMetric) {
        missingMetrics.push({
          forecastFactorId: factor.id,
          sourceKey: factor.sourceKey,
          metricType: factor.metricType,
        });

        continue;
      }

      actualMetrics.push({
        forecastFactorId: factor.id,
        originalMetricId: factor.metricId,
        actualMetricId: actualMetric.id,
        sourceKey: actualMetric.sourceKey,
        metricType: actualMetric.metricType,
        rawValue: actualMetric.value,
        normalizedValue: actualMetric.normalizedValue,
        recordedAt: actualMetric.recordedAt,
      });
    }

    return {
      forecastId: target.forecastId,
      entityId: target.entityId,
      targetAt: target.targetAt,
      evaluatedAt: new Date(),
      actualMetrics,
      missingMetrics,
      ingestionFailures: ingestionResult.failures,
    };
  }

  private selectLatestMetrics(
    metrics: readonly PersistedMetricRecord[],
  ): ReadonlyMap<string, PersistedMetricRecord> {
    const latestByKey = new Map<string, PersistedMetricRecord>();

    for (const metric of metrics) {
      const key = createMetricKey(metric.sourceKey, metric.metricType);

      const current = latestByKey.get(key);

      if (!current || this.isNewer(metric, current)) {
        latestByKey.set(key, metric);
      }
    }

    return latestByKey;
  }

  private isNewer(
    candidate: PersistedMetricRecord,
    current: PersistedMetricRecord,
  ): boolean {
    const candidateTime = candidate.recordedAt.getTime();

    const currentTime = current.recordedAt.getTime();

    if (candidateTime !== currentTime) {
      return candidateTime > currentTime;
    }

    return candidate.id > current.id;
  }
}
