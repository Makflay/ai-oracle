import {
  ForecastType,
  MetricType,
  DeveloperInterestPrediction,
  ForecastKind,
} from "@ai-oracle/shared";
import {
  createWeightedForecastFactors,
  determineDeveloperInterestPrediction,
  calculateForecastConfidence,
  calculateForecastRisk,
  createForecastRiskReason,
  calculateForecastTrend,
  explainForecastFactors,
  selectForecastMetricPairs,
} from "../calculations/index.js";

import type {
  ForecastMetricInput,
  ForecastStrategy,
  ForecastStrategyFactor,
  ForecastStrategyInput,
  ForecastStrategyResult,
} from "../contracts/index.js";

const FORECAST_HORIZON_DAYS = 14;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;

const SOURCE_WEIGHTS = {
  hacker_news: 0.4,
  hugging_face: 0.35,
  arxiv: 0.25,
} as const;

type SupportedSourceKey = keyof typeof SOURCE_WEIGHTS;

const SOURCE_METRIC_TYPES: Readonly<
  Record<SupportedSourceKey, ReadonlySet<MetricType>>
> = {
  hacker_news: new Set([
    MetricType.Mentions,
    MetricType.Score,
    MetricType.Comments,
    MetricType.Engagement,
  ]),

  hugging_face: new Set([MetricType.Downloads, MetricType.Likes]),

  arxiv: new Set([MetricType.Publications, MetricType.Mentions]),
};

export class InsufficientDeveloperInterestMetricsError extends Error {
  constructor(readonly missingSources: readonly SupportedSourceKey[]) {
    super(
      "Developer interest forecast requires metrics " +
        `from: ${missingSources.join(", ")}`,
    );

    this.name = "InsufficientDeveloperInterestMetricsError";
  }
}

export class InvalidDeveloperInterestHorizonError extends Error {
  constructor() {
    super(
      `Developer interest forecast requires a ${FORECAST_HORIZON_DAYS}-day horizon`,
    );

    this.name = "InvalidDeveloperInterestHorizonError";
  }
}

export class DeveloperInterestStrategy implements ForecastStrategy<DeveloperInterestPrediction> {
  readonly key = "developer_interest";
  readonly kind = ForecastKind.DeveloperInterest;

  async forecast(
    input: ForecastStrategyInput,
  ): Promise<ForecastStrategyResult<DeveloperInterestPrediction>> {
    this.validateInput(input);

    const supportedMetrics = input.metrics.filter((metric) =>
      this.isSupportedMetric(metric),
    );

    const pairs = selectForecastMetricPairs(supportedMetrics);

    const currentMetrics = pairs.map((pair) => pair.current);

    const latestMetrics = this.selectLatestMetrics(currentMetrics);

    const metricsBySource = this.groupMetricsBySource(latestMetrics);

    this.ensureRequiredSources(metricsBySource);

    const currentFactors = this.createFactors(metricsBySource);

    const index = this.clampIndex(
      currentFactors.reduce((total, factor) => total + factor.contribution, 0),
    );

    const trend = calculateForecastTrend(index, currentFactors, pairs);

    const factors = explainForecastFactors(currentFactors, trend);

    const prediction = determineDeveloperInterestPrediction(
      trend.predictedValue,
    );

    const confidence = calculateForecastConfidence({
      metrics: latestMetrics,
      asOf: input.asOf,
      expectedSignalCount: 8,
      expectedSourceCount: 3,
      trendHistoryQuality: trend.historyQuality,
    });

    const risk = calculateForecastRisk({
      confidence: confidence.value,
      sourceConsistency: confidence.sourceConsistency,
      freshness: confidence.freshness,
      signalCoverage: confidence.signalCoverage,
    });

    const riskReason = createForecastRiskReason(risk);

    const summary = trend.trendAvailable
      ? `Текущий глобальный индекс интереса AI-разработчиков — ` +
        `${index}/100. Историческое базовое значение — ` +
        `${trend.baselineValue}/100 за период ` +
        `${trend.actualHistorySpanDays} дн. ` +
        `Наблюдаемое изменение — ${trend.observedDelta}; ` +
        `прогнозируемое изменение за 14 дней — ${trend.projectedDelta}. ` +
        `Ожидаемое значение на целевую дату — ` +
        `${trend.predictedValue}/100.`
      : `Текущий глобальный индекс интереса AI-разработчиков — ` +
        `${index}/100. Глубина сопоставимых исторических данных меньше ` +
        "необходимых 7 дней, поэтому тренд не экстраполировался. " +
        `Консервативное ожидаемое значение на целевую дату — ` +
        `${trend.predictedValue}/100.`;

    return {
      score: index,
      predictedValue: trend.predictedValue,
      prediction,
      confidence: confidence.value,
      risk: risk.level,
      riskReason,
      factors,
      summary,
    };
  }

  private validateInput(input: ForecastStrategyInput): void {
    if (input.forecastType !== ForecastType.ShortTerm) {
      throw new InvalidDeveloperInterestHorizonError();
    }

    const asOf = Date.parse(input.asOf);
    const targetAt = Date.parse(input.targetAt);

    if (
      Number.isNaN(asOf) ||
      Number.isNaN(targetAt) ||
      targetAt - asOf !== FORECAST_HORIZON_DAYS * MILLISECONDS_PER_DAY
    ) {
      throw new InvalidDeveloperInterestHorizonError();
    }

    for (const metric of input.metrics) {
      if (
        !Number.isFinite(metric.rawValue) ||
        !Number.isFinite(metric.normalizedValue) ||
        metric.normalizedValue < 0 ||
        metric.normalizedValue > 100 ||
        Number.isNaN(Date.parse(metric.recordedAt))
      ) {
        throw new Error(`Invalid forecast metric "${metric.metricId}"`);
      }
    }
  }

  private selectLatestMetrics(
    metrics: readonly ForecastMetricInput[],
  ): readonly ForecastMetricInput[] {
    const latestBySourceAndType = new Map<string, ForecastMetricInput>();

    for (const metric of metrics) {
      if (!this.isSupportedMetric(metric)) {
        continue;
      }

      const key = `${metric.sourceKey}:${metric.type}`;

      const current = latestBySourceAndType.get(key);

      if (
        !current ||
        Date.parse(metric.recordedAt) > Date.parse(current.recordedAt)
      ) {
        latestBySourceAndType.set(key, metric);
      }
    }

    return [...latestBySourceAndType.values()];
  }

  private isSupportedMetric(
    metric: ForecastMetricInput,
  ): metric is ForecastMetricInput & {
    sourceKey: SupportedSourceKey;
  } {
    if (!this.isSupportedSource(metric.sourceKey)) {
      return false;
    }

    return SOURCE_METRIC_TYPES[metric.sourceKey].has(metric.type);
  }

  private isSupportedSource(
    sourceKey: string,
  ): sourceKey is SupportedSourceKey {
    return sourceKey in SOURCE_WEIGHTS;
  }

  private groupMetricsBySource(
    metrics: readonly ForecastMetricInput[],
  ): ReadonlyMap<SupportedSourceKey, readonly ForecastMetricInput[]> {
    const grouped = new Map<SupportedSourceKey, ForecastMetricInput[]>();

    for (const metric of metrics) {
      if (!this.isSupportedSource(metric.sourceKey)) {
        continue;
      }

      const sourceMetrics = grouped.get(metric.sourceKey) ?? [];

      sourceMetrics.push(metric);

      grouped.set(metric.sourceKey, sourceMetrics);
    }

    return grouped;
  }

  private ensureRequiredSources(
    metricsBySource: ReadonlyMap<
      SupportedSourceKey,
      readonly ForecastMetricInput[]
    >,
  ): void {
    const sourceKeys = Object.keys(SOURCE_WEIGHTS) as SupportedSourceKey[];

    const missingSources = sourceKeys.filter(
      (sourceKey) => !metricsBySource.get(sourceKey)?.length,
    );

    if (missingSources.length > 0) {
      throw new InsufficientDeveloperInterestMetricsError(missingSources);
    }
  }

  private createFactors(
    metricsBySource: ReadonlyMap<
      SupportedSourceKey,
      readonly ForecastMetricInput[]
    >,
  ): readonly ForecastStrategyFactor[] {
    const factors: ForecastStrategyFactor[] = [];

    const sourceKeys = Object.keys(SOURCE_WEIGHTS) as SupportedSourceKey[];

    for (const sourceKey of sourceKeys) {
      const metrics = metricsBySource.get(sourceKey) ?? [];
      factors.push(
        ...createWeightedForecastFactors(metrics, SOURCE_WEIGHTS[sourceKey]),
      );
    }

    return factors;
  }

  private clampIndex(index: number): number {
    return Math.min(100, Math.max(0, this.round(index)));
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
