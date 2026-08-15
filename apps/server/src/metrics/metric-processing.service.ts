import type { MetricExtractor } from "./extractors/index.js";
import { normalizeMetrics } from "./normalization/index.js";
import type {
  MetricPersistence,
  MetricPersistenceRecord,
  MetricPersistenceResult,
} from "./persistence/index.js";
import type { MetricSourceRecord } from "./metric-processing.types.js";

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
    const metrics = records.flatMap((record) => this.processRecord(record));

    return this.persistence.save(metrics);
  }

  private processRecord(
    record: MetricSourceRecord,
  ): readonly MetricPersistenceRecord[] {
    const extractor = this.extractorBySource.get(record.sourceKey);

    if (!extractor) {
      throw new Error(
        `No metric extractor configured for source "${record.sourceKey}"`,
      );
    }

    const extractedMetrics = extractor.extract(record.payload);

    const normalizedMetrics = normalizeMetrics(extractedMetrics);

    return normalizedMetrics.map((metric) => ({
      rawRecordId: record.rawRecordId,
      entityId: record.entityId,
      metricType: metric.type,
      value: metric.rawValue,
      normalizedValue: metric.normalizedValue,
      recordedAt: record.recordedAt,
    }));
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
