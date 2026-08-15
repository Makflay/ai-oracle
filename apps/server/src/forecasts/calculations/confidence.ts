import type { ForecastMetricInput } from "../contracts/index.js";

const MIN_SCORE = 0;
const MAX_SCORE = 100;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;
const DECIMAL_PRECISION = 2;

export const CONFIDENCE_COMPONENT_WEIGHTS = {
  sourceConsistency: 0.4,
  freshness: 0.35,
  signalCoverage: 0.25,
} as const;

export const FRESHNESS_THRESHOLDS = [
  {
    maximumAgeDays: 1,
    score: 100,
  },
  {
    maximumAgeDays: 3,
    score: 85,
  },
  {
    maximumAgeDays: 7,
    score: 65,
  },
  {
    maximumAgeDays: 14,
    score: 40,
  },
] as const;

export interface ForecastConfidenceInput {
  readonly metrics: readonly ForecastMetricInput[];
  readonly asOf: string;
  readonly expectedSignalCount: number;
  readonly expectedSourceCount: number;
}

export interface ForecastConfidenceResult {
  readonly value: number;
  readonly sourceConsistency: number;
  readonly freshness: number;
  readonly signalCoverage: number;
}

export class InvalidForecastConfidenceInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidForecastConfidenceInputError";
  }
}

export function calculateForecastConfidence(
  input: ForecastConfidenceInput,
): ForecastConfidenceResult {
  validateInput(input);

  if (input.metrics.length === 0) {
    return {
      value: 0,
      sourceConsistency: 0,
      freshness: 0,
      signalCoverage: 0,
    };
  }

  const asOfTime = Date.parse(input.asOf);

  const sourceConsistency = calculateSourceConsistency(
    input.metrics,
    input.expectedSourceCount,
  );

  const freshness = calculateFreshness(input.metrics, asOfTime);

  const signalCoverage = calculateSignalCoverage(
    input.metrics,
    input.expectedSignalCount,
  );

  const value = clampAndRound(
    sourceConsistency * CONFIDENCE_COMPONENT_WEIGHTS.sourceConsistency +
      freshness * CONFIDENCE_COMPONENT_WEIGHTS.freshness +
      signalCoverage * CONFIDENCE_COMPONENT_WEIGHTS.signalCoverage,
  );

  return {
    value,
    sourceConsistency,
    freshness,
    signalCoverage,
  };
}

function calculateSourceConsistency(
  metrics: readonly ForecastMetricInput[],
  expectedSourceCount: number,
): number {
  const metricsBySource = new Map<string, number[]>();

  for (const metric of metrics) {
    const values = metricsBySource.get(metric.sourceKey) ?? [];

    values.push(metric.normalizedValue);

    metricsBySource.set(metric.sourceKey, values);
  }

  const sourceScores = [...metricsBySource.values()].map(average);

  if (sourceScores.length === 0) {
    return 0;
  }

  const minimumScore = Math.min(...sourceScores);
  const maximumScore = Math.max(...sourceScores);

  const agreement = clampAndRound(MAX_SCORE - (maximumScore - minimumScore));

  const sourceAvailability = Math.min(
    1,
    sourceScores.length / expectedSourceCount,
  );

  return clampAndRound(agreement * sourceAvailability);
}

function calculateFreshness(
  metrics: readonly ForecastMetricInput[],
  asOfTime: number,
): number {
  const freshnessScores = metrics.map((metric) => {
    const recordedAt = Date.parse(metric.recordedAt);

    const ageMilliseconds = asOfTime - recordedAt;

    if (ageMilliseconds < 0) {
      throw new InvalidForecastConfidenceInputError(
        `Metric "${metric.metricId}" is recorded after forecast asOf`,
      );
    }

    const ageDays = ageMilliseconds / MILLISECONDS_PER_DAY;

    const threshold = FRESHNESS_THRESHOLDS.find(
      (item) => ageDays <= item.maximumAgeDays,
    );

    return threshold?.score ?? 0;
  });

  return clampAndRound(average(freshnessScores));
}

function calculateSignalCoverage(
  metrics: readonly ForecastMetricInput[],
  expectedSignalCount: number,
): number {
  const uniqueSignals = new Set(
    metrics.map((metric) => `${metric.sourceKey}:${metric.type}`),
  );

  return clampAndRound(
    Math.min(1, uniqueSignals.size / expectedSignalCount) * MAX_SCORE,
  );
}

function validateInput(input: ForecastConfidenceInput): void {
  if (Number.isNaN(Date.parse(input.asOf))) {
    throw new InvalidForecastConfidenceInputError(
      "Confidence calculation requires a valid asOf date",
    );
  }

  if (
    !Number.isSafeInteger(input.expectedSignalCount) ||
    input.expectedSignalCount <= 0
  ) {
    throw new InvalidForecastConfidenceInputError(
      "Expected signal count must be a positive integer",
    );
  }

  if (
    !Number.isSafeInteger(input.expectedSourceCount) ||
    input.expectedSourceCount <= 0
  ) {
    throw new InvalidForecastConfidenceInputError(
      "Expected source count must be a positive integer",
    );
  }

  for (const metric of input.metrics) {
    if (
      !Number.isFinite(metric.normalizedValue) ||
      metric.normalizedValue < MIN_SCORE ||
      metric.normalizedValue > MAX_SCORE
    ) {
      throw new InvalidForecastConfidenceInputError(
        `Metric "${metric.metricId}" must have a normalized value between 0 and 100`,
      );
    }

    if (Number.isNaN(Date.parse(metric.recordedAt))) {
      throw new InvalidForecastConfidenceInputError(
        `Metric "${metric.metricId}" has an invalid recordedAt date`,
      );
    }
  }
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function clampAndRound(value: number): number {
  const clamped = Math.min(MAX_SCORE, Math.max(MIN_SCORE, value));

  const multiplier = 10 ** DECIMAL_PRECISION;

  return Math.round(clamped * multiplier) / multiplier;
}
