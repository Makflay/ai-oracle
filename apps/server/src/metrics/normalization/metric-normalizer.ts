import type { MetricType } from "@ai-oracle/shared";

import type { ExtractedMetric } from "../extractors/index.js";
import { metricNormalizationRules } from "./metric-normalization.rules.js";
import type {
  MetricNormalizationRule,
  NormalizationThreshold,
  NormalizedMetric,
} from "./metric-normalization.types.js";

const MIN_NORMALIZED_VALUE = 0;
const MAX_NORMALIZED_VALUE = 100;
const DECIMAL_PRECISION = 2;

export class UnsupportedMetricNormalizationError extends Error {
  constructor(readonly metricType: MetricType) {
    super(`No normalization rule configured for metric "${metricType}"`);

    this.name = "UnsupportedMetricNormalizationError";
  }
}

export class InvalidRawMetricValueError extends Error {
  constructor(
    readonly metricType: MetricType,
    readonly rawValue: number,
  ) {
    super(`Invalid raw value "${rawValue}" for metric "${metricType}"`);

    this.name = "InvalidRawMetricValueError";
  }
}

export function normalizeMetric(metric: ExtractedMetric): NormalizedMetric {
  validateRawValue(metric);

  const rule = getNormalizationRule(metric.type);

  return {
    type: metric.type,
    rawValue: metric.rawValue,
    normalizedValue: applyRule(metric.rawValue, rule),
  };
}

export function normalizeMetrics(
  metrics: readonly ExtractedMetric[],
): readonly NormalizedMetric[] {
  return metrics.map(normalizeMetric);
}

function getNormalizationRule(metricType: MetricType): MetricNormalizationRule {
  const rule = metricNormalizationRules[metricType];

  if (!rule) {
    throw new UnsupportedMetricNormalizationError(metricType);
  }

  return rule;
}

function validateRawValue(metric: ExtractedMetric): void {
  if (!Number.isFinite(metric.rawValue) || metric.rawValue < 0) {
    throw new InvalidRawMetricValueError(metric.type, metric.rawValue);
  }
}

function applyRule(rawValue: number, rule: MetricNormalizationRule): number {
  const thresholds = rule.thresholds;
  const firstThreshold = thresholds[0];
  const lastThreshold = thresholds[thresholds.length - 1];

  if (!firstThreshold || !lastThreshold) {
    throw new Error(
      `Normalization rule "${rule.metricType}" has no thresholds`,
    );
  }

  if (rawValue <= firstThreshold.rawValue) {
    return clampAndRound(firstThreshold.normalizedValue);
  }

  if (rawValue >= lastThreshold.rawValue) {
    return clampAndRound(lastThreshold.normalizedValue);
  }

  for (let index = 1; index < thresholds.length; index += 1) {
    const upperThreshold = thresholds[index];
    const lowerThreshold = thresholds[index - 1];

    if (!upperThreshold || !lowerThreshold) {
      continue;
    }

    if (rawValue <= upperThreshold.rawValue) {
      return interpolate(rawValue, lowerThreshold, upperThreshold);
    }
  }

  return clampAndRound(lastThreshold.normalizedValue);
}

function interpolate(
  rawValue: number,
  lower: NormalizationThreshold,
  upper: NormalizationThreshold,
): number {
  const rawRange = upper.rawValue - lower.rawValue;

  if (rawRange <= 0) {
    throw new Error("Normalization thresholds must be ordered by rawValue");
  }

  const normalizedRange = upper.normalizedValue - lower.normalizedValue;

  const progress = (rawValue - lower.rawValue) / rawRange;

  const normalizedValue = lower.normalizedValue + normalizedRange * progress;

  return clampAndRound(normalizedValue);
}

function clampAndRound(value: number): number {
  const clamped = Math.min(
    MAX_NORMALIZED_VALUE,
    Math.max(MIN_NORMALIZED_VALUE, value),
  );

  const multiplier = 10 ** DECIMAL_PRECISION;

  return Math.round(clamped * multiplier) / multiplier;
}
