import type { MetricType } from "@ai-oracle/shared";

export interface NormalizationThreshold {
  readonly rawValue: number;
  readonly normalizedValue: number;
}

export interface MetricNormalizationRule {
  readonly metricType: MetricType;
  readonly description: string;
  readonly thresholds: readonly NormalizationThreshold[];
}

export interface NormalizedMetric {
  readonly type: MetricType;
  readonly rawValue: number;
  readonly normalizedValue: number;
}
