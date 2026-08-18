import type {
  ForecastMetricInput,
  ForecastStrategyFactor,
} from "../contracts/index.js";

const MIN_NORMALIZED_VALUE = 0;
const MAX_NORMALIZED_VALUE = 100;

const MIN_WEIGHT = 0;
const MAX_WEIGHT = 1;

const DECIMAL_PRECISION = 2;

export class InvalidForecastFactorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidForecastFactorError";
  }
}

export function createWeightedForecastFactor(
  metric: ForecastMetricInput,
  weight: number,
): ForecastStrategyFactor {
  validateMetric(metric);
  validateWeight(weight);

  const roundedWeight = round(weight);
  const contribution = round(metric.normalizedValue * weight);

  return {
    metricId: metric.metricId,
    sourceKey: metric.sourceKey,
    metricType: metric.type,
    rawValue: metric.rawValue,
    normalizedValue: metric.normalizedValue,
    weight: roundedWeight,
    contribution,
    description: createDescription(metric, roundedWeight, contribution),
  };
}

export function createWeightedForecastFactors(
  metrics: readonly ForecastMetricInput[],
  sourceWeight: number,
): readonly ForecastStrategyFactor[] {
  validateWeight(sourceWeight);

  if (metrics.length === 0) {
    return [];
  }

  const metricWeight = sourceWeight / metrics.length;

  return metrics.map((metric) =>
    createWeightedForecastFactor(metric, metricWeight),
  );
}

function validateMetric(metric: ForecastMetricInput): void {
  if (!metric.metricId.trim()) {
    throw new InvalidForecastFactorError(
      "Forecast factor requires a metric ID",
    );
  }

  if (!metric.sourceKey.trim()) {
    throw new InvalidForecastFactorError(
      "Forecast factor requires a source key",
    );
  }

  if (!Number.isFinite(metric.rawValue)) {
    throw new InvalidForecastFactorError(
      `Metric "${metric.metricId}" has an invalid raw value`,
    );
  }

  if (
    !Number.isFinite(metric.normalizedValue) ||
    metric.normalizedValue < MIN_NORMALIZED_VALUE ||
    metric.normalizedValue > MAX_NORMALIZED_VALUE
  ) {
    throw new InvalidForecastFactorError(
      `Metric "${metric.metricId}" must have a normalized value between 0 and 100`,
    );
  }
}

function validateWeight(weight: number): void {
  if (!Number.isFinite(weight) || weight < MIN_WEIGHT || weight > MAX_WEIGHT) {
    throw new InvalidForecastFactorError(
      "Forecast factor weight must be between 0 and 1",
    );
  }
}

function createDescription(
  metric: ForecastMetricInput,
  weight: number,
  contribution: number,
): string {
  const percentage = round(weight * 100);

  return (
    `${metric.sourceKey} ${metric.type}: ` +
    `нормализованное значение ${metric.normalizedValue} ` +
    `× вес ${weight} (${percentage}%) ` +
    `= ${contribution} балла в итоговой оценке.`
  );
}

function round(value: number): number {
  const multiplier = 10 ** DECIMAL_PRECISION;

  return Math.round(value * multiplier) / multiplier;
}
