export {
  ArxivMetricExtractor,
  HackerNewsMetricExtractor,
  HuggingFaceMetricExtractor,
  InvalidMetricPayloadError,
} from "./extractors/index.js";

export type { ExtractedMetric, MetricExtractor } from "./extractors/index.js";

export {
  InvalidRawMetricValueError,
  UnsupportedMetricNormalizationError,
  metricNormalizationRules,
  normalizeMetric,
  normalizeMetrics,
} from "./normalization/index.js";

export type {
  MetricNormalizationRule,
  NormalizationThreshold,
  NormalizedMetric,
} from "./normalization/index.js";

export { MetricProcessingService } from "./metric-processing.service.js";

export type { MetricSourceRecord } from "./metric-processing.types.js";

export type {
  MetricPersistence,
  MetricPersistenceRecord,
  MetricPersistenceResult,
} from "./persistence/index.js";
