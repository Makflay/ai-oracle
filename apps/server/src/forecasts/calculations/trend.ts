import { PredictionDirection, type MetricType } from "@ai-oracle/shared";

import type {
  ForecastMetricInput,
  ForecastStrategyFactor,
} from "../contracts/index.js";

const DAY_MS = 24 * 60 * 60 * 1_000;

export const FORECAST_HORIZON_DAYS = 14;
export const HISTORICAL_LOOKBACK_DAYS = 28;
export const MINIMUM_USABLE_HISTORY_DAYS = 7;
export const MAXIMUM_PROJECTED_CHANGE = 20;

export interface ForecastMetricTrendPair {
  readonly current: ForecastMetricInput;
  readonly baseline: ForecastMetricInput | null;
  readonly historySpanDays: number | null;
}

export interface ForecastTrendResult {
  readonly trendAvailable: boolean;
  readonly baselineValue: number | null;
  readonly observedDelta: number | null;
  readonly projectedDelta: number;
  readonly predictedValue: number;
  readonly actualHistorySpanDays: number | null;
  readonly historyQuality: number;
  readonly pairs: readonly ForecastMetricTrendPair[];
}

const metricKey = (sourceKey: string, metricType: MetricType): string =>
  `${sourceKey}:${metricType}`;

const round = (value: number): number => Math.round(value * 100) / 100;

export const clampForecastValue = (value: number): number =>
  Math.min(100, Math.max(0, round(value)));

export const directionFromDelta = (delta: number): PredictionDirection => {
  if (delta > 0) {
    return PredictionDirection.Up;
  }

  if (delta < 0) {
    return PredictionDirection.Down;
  }

  return PredictionDirection.Neutral;
};

export const selectForecastMetricPairs = (
  metrics: readonly ForecastMetricInput[],
): readonly ForecastMetricTrendPair[] => {
  const metricsByKey = new Map<string, ForecastMetricInput[]>();

  for (const metric of metrics) {
    const key = metricKey(metric.sourceKey, metric.type);
    const values = metricsByKey.get(key) ?? [];

    values.push(metric);
    metricsByKey.set(key, values);
  }

  return [...metricsByKey.values()].flatMap((values) => {
    const ordered = [...values].sort((left, right) => {
      const timeDifference =
        Date.parse(right.recordedAt) - Date.parse(left.recordedAt);

      return timeDifference || right.metricId.localeCompare(left.metricId);
    });

    const current = ordered[0];

    if (!current) {
      return [];
    }

    const currentAt = Date.parse(current.recordedAt);
    const preferredBaselineAt = currentAt - FORECAST_HORIZON_DAYS * DAY_MS;

    const historicalMetrics = ordered.filter(
      (metric) =>
        metric.metricId !== current.metricId &&
        Date.parse(metric.recordedAt) < currentAt,
    );

    const baseline =
      historicalMetrics.sort((left, right) => {
        const leftDistance = Math.abs(
          Date.parse(left.recordedAt) - preferredBaselineAt,
        );

        const rightDistance = Math.abs(
          Date.parse(right.recordedAt) - preferredBaselineAt,
        );

        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }

        const timeDifference =
          Date.parse(right.recordedAt) - Date.parse(left.recordedAt);

        return timeDifference || right.metricId.localeCompare(left.metricId);
      })[0] ?? null;

    const historySpanDays = baseline
      ? (currentAt - Date.parse(baseline.recordedAt)) / DAY_MS
      : null;

    return [
      {
        current,
        baseline,
        historySpanDays,
      },
    ];
  });
};

export const calculateForecastTrend = (
  currentValue: number,
  factors: readonly ForecastStrategyFactor[],
  pairs: readonly ForecastMetricTrendPair[],
): ForecastTrendResult => {
  const pairByKey = new Map(
    pairs.map((pair) => [
      metricKey(pair.current.sourceKey, pair.current.type),
      pair,
    ]),
  );

  let baselineValue = 0;
  let weightedHistorySpan = 0;
  let historyQuality = 0;
  let hasCompleteUsableHistory = factors.length > 0;

  for (const factor of factors) {
    const pair = pairByKey.get(metricKey(factor.sourceKey, factor.metricType));

    const baseline = pair?.baseline ?? null;
    const spanDays = pair?.historySpanDays ?? null;

    if (!baseline || spanDays === null) {
      hasCompleteUsableHistory = false;
      continue;
    }

    const signalHistoryQuality =
      spanDays < MINIMUM_USABLE_HISTORY_DAYS
        ? 0
        : Math.min(100, (spanDays / FORECAST_HORIZON_DAYS) * 100);

    historyQuality += signalHistoryQuality * factor.weight;

    if (spanDays < MINIMUM_USABLE_HISTORY_DAYS) {
      hasCompleteUsableHistory = false;
      continue;
    }

    baselineValue += baseline.normalizedValue * factor.weight;

    weightedHistorySpan += spanDays * factor.weight;
  }

  const normalizedHistoryQuality = clampForecastValue(historyQuality);

  if (
    !hasCompleteUsableHistory ||
    weightedHistorySpan < MINIMUM_USABLE_HISTORY_DAYS
  ) {
    return {
      trendAvailable: false,
      baselineValue: null,
      observedDelta: null,
      projectedDelta: 0,
      predictedValue: clampForecastValue(currentValue),
      actualHistorySpanDays: null,
      historyQuality: normalizedHistoryQuality,
      pairs,
    };
  }

  const roundedBaselineValue = clampForecastValue(baselineValue);

  const observedDelta = round(currentValue - roundedBaselineValue);

  const rawProjectedDelta =
    observedDelta * (FORECAST_HORIZON_DAYS / weightedHistorySpan);

  const projectedDelta = round(
    Math.min(
      MAXIMUM_PROJECTED_CHANGE,
      Math.max(-MAXIMUM_PROJECTED_CHANGE, rawProjectedDelta),
    ),
  );

  return {
    trendAvailable: true,
    baselineValue: roundedBaselineValue,
    observedDelta,
    projectedDelta,
    predictedValue: clampForecastValue(currentValue + projectedDelta),
    actualHistorySpanDays: round(weightedHistorySpan),
    historyQuality: normalizedHistoryQuality,
    pairs,
  };
};

export const explainForecastFactors = (
  factors: readonly ForecastStrategyFactor[],
  trend: ForecastTrendResult,
): readonly ForecastStrategyFactor[] => {
  const pairByKey = new Map(
    trend.pairs.map((pair) => [
      metricKey(pair.current.sourceKey, pair.current.type),
      pair,
    ]),
  );

  return factors.map((factor) => {
    const pair = pairByKey.get(metricKey(factor.sourceKey, factor.metricType));

    if (
      !trend.trendAvailable ||
      !pair?.baseline ||
      pair.historySpanDays === null
    ) {
      return {
        ...factor,
        direction: PredictionDirection.Neutral,
        description:
          `${factor.description} Глубина сопоставимых исторических данных ` +
          "недостаточна, поэтому направление тренда не определялось.",
      };
    }

    const signalDelta = round(
      pair.current.normalizedValue - pair.baseline.normalizedValue,
    );

    return {
      ...factor,
      direction: directionFromDelta(signalDelta),
      description:
        `${factor.description} Базовое нормализованное значение — ` +
        `${pair.baseline.normalizedValue}, получено ` +
        `${round(pair.historySpanDays)} дн. назад; ` +
        `наблюдаемое изменение сигнала — ${signalDelta}.`,
    };
  });
};
