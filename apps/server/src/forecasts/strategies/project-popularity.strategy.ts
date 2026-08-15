import {
  ForecastType,
  MetricType,
  ProjectPopularityPrediction,
} from "@ai-oracle/shared";
import {
  createWeightedForecastFactors,
  determineProjectPopularityPrediction,
  calculateForecastConfidence,
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
  hugging_face: 0.5,
  hacker_news: 0.3,
  arxiv: 0.2,
} as const;

type SupportedSourceKey = keyof typeof SOURCE_WEIGHTS;

const SOURCE_METRIC_TYPES: Readonly<
  Record<SupportedSourceKey, ReadonlySet<MetricType>>
> = {
  hugging_face: new Set([MetricType.Downloads, MetricType.Likes]),

  hacker_news: new Set([
    MetricType.Mentions,
    MetricType.Score,
    MetricType.Comments,
    MetricType.Engagement,
  ]),

  arxiv: new Set([MetricType.Publications, MetricType.Mentions]),
};

export class InsufficientForecastMetricsError extends Error {
  constructor(readonly missingSources: readonly SupportedSourceKey[]) {
    super(
      "Project popularity forecast requires metrics " +
        `from: ${missingSources.join(", ")}`,
    );

    this.name = "InsufficientForecastMetricsError";
  }
}

export class InvalidForecastHorizonError extends Error {
  constructor() {
    super(
      `Project popularity forecast requires a ${FORECAST_HORIZON_DAYS}-day horizon`,
    );

    this.name = "InvalidForecastHorizonError";
  }
}

export class ProjectPopularityStrategy implements ForecastStrategy<ProjectPopularityPrediction> {
  readonly key = "project_popularity";

  async forecast(
    input: ForecastStrategyInput,
  ): Promise<ForecastStrategyResult<ProjectPopularityPrediction>> {
    this.validateInput(input);

    const latestMetrics = this.selectLatestMetrics(input.metrics);

    const metricsBySource = this.groupMetricsBySource(latestMetrics);

    this.ensureRequiredSources(metricsBySource);

    const factors = this.createFactors(metricsBySource);

    const score = this.round(
      factors.reduce((total, factor) => total + factor.contribution, 0),
    );

    const prediction = determineProjectPopularityPrediction(score);
    const confidence = calculateForecastConfidence({
      metrics: latestMetrics,
      asOf: input.asOf,
      expectedSignalCount: 8,
      expectedSourceCount: 3,
    });

    return {
      score,
      prediction,
      confidence: confidence.value,
      factors,
      summary:
        `Project popularity score is ${this.clampScore(score)}/100 ` +
        `for the next ${FORECAST_HORIZON_DAYS} days, ` +
        "based on Hugging Face (50%), " +
        "Hacker News (30%), and arXiv (20%).",
    };
  }

  private validateInput(input: ForecastStrategyInput): void {
    if (input.forecastType !== ForecastType.ShortTerm) {
      throw new InvalidForecastHorizonError();
    }

    const asOf = Date.parse(input.asOf);
    const targetAt = Date.parse(input.targetAt);

    if (
      Number.isNaN(asOf) ||
      Number.isNaN(targetAt) ||
      targetAt - asOf !== FORECAST_HORIZON_DAYS * MILLISECONDS_PER_DAY
    ) {
      throw new InvalidForecastHorizonError();
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
      throw new InsufficientForecastMetricsError(missingSources);
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

  private clampScore(score: number): number {
    return Math.min(100, Math.max(0, this.round(score)));
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
