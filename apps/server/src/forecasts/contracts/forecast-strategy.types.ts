import type {
  ForecastType,
  MetricType,
  PredictionDirection,
} from "@ai-oracle/shared";

export interface ForecastMetricInput {
  readonly metricId: string;
  readonly sourceKey: string;
  readonly type: MetricType;
  readonly rawValue: number;
  readonly normalizedValue: number;
  readonly recordedAt: string;
}

export interface ForecastStrategyInput {
  readonly entityId: string;
  readonly forecastType: ForecastType;
  readonly asOf: string;
  readonly targetAt: string;
  readonly metrics: readonly ForecastMetricInput[];
}

export interface ForecastStrategyFactor {
  readonly metricId: string;
  readonly sourceKey: string;
  readonly metricType: MetricType;
  readonly rawValue: number;
  readonly normalizedValue: number;
  readonly weight: number;
  readonly contribution: number;
  readonly direction?: PredictionDirection;
  readonly description: string;
}

export interface ForecastStrategyResult<TPrediction extends string = string> {
  readonly score: number;
  readonly prediction: TPrediction;
  readonly factors: readonly ForecastStrategyFactor[];
  readonly summary: string;
}
