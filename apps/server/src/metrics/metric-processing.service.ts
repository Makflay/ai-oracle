import type { MetricExtractor } from "./extractors/index.js";
import { normalizeMetric } from "./normalization/index.js";
import type {
  MetricPersistence,
  MetricPersistenceRecord,
  MetricPersistenceResult,
} from "./persistence/index.js";
import type { MetricSourceRecord } from "./metric-processing.types.js";
import {
  aggregateMetricObservations,
  createMetricObservations,
} from "./metric-aggregation.js";

export class MetricProcessingService {
  private readonly extractorBySource: ReadonlyMap<string, MetricExtractor>;

  constructor(
    extractors: readonly MetricExtractor[],
    private readonly persistence: MetricPersistence,
  ) {
    this.extractorBySource = this.createExtractorRegistry(extractors);
  }

  async process(
    records: readonly MetricSourceRecord[],
  ): Promise<MetricPersistenceResult> {
    const observations = records.flatMap((record) =>
      this.extractRecord(record),
    );

    const aggregatedObservations = aggregateMetricObservations(observations);

    const metrics: readonly MetricPersistenceRecord[] =
      aggregatedObservations.map((observation) => {
        const normalized = normalizeMetric({
          type: observation.type,
          rawValue: observation.rawValue,
        });

        return {
          rawRecordId: observation.rawRecordId,
          entityId: observation.entityId,
          metricType: normalized.type,
          value: normalized.rawValue,
          normalizedValue: normalized.normalizedValue,
          recordedAt: observation.recordedAt,
        };
      });

    return this.persistence.save(metrics);
  }

  private extractRecord(record: MetricSourceRecord) {
    const extractor = this.extractorBySource.get(record.sourceKey);

    if (!extractor) {
      throw new Error(
        `No metric extractor configured for source "${record.sourceKey}"`,
      );
    }

    return createMetricObservations(record, extractor.extract(record.payload));
  }

  private createExtractorRegistry(
    extractors: readonly MetricExtractor[],
  ): ReadonlyMap<string, MetricExtractor> {
    const registry = new Map<string, MetricExtractor>();

    for (const extractor of extractors) {
      if (registry.has(extractor.sourceKey)) {
        throw new Error(
          `Duplicate metric extractor for source "${extractor.sourceKey}"`,
        );
      }

      registry.set(extractor.sourceKey, extractor);
    }

    return registry;
  }
}
