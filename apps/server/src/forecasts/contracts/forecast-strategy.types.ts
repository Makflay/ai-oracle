import type {
  ForecastType,
  MetricType,
  PredictionDirection,
  RiskLevel,
} from "@ai-oracle/shared";

export interface ForecastMetricInput {
  readonly metricId: string;
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

export interface ForecastPrediction {
  readonly direction: PredictionDirection;
  readonly confidence: number;
  readonly riskLevel: RiskLevel;
}

export interface ForecastStrategyFactor {
  readonly metricId: string;
  readonly metricType: MetricType;
  readonly rawValue: number;
  readonly normalizedValue: number;
  readonly weight: number;
  readonly contribution: number;
  readonly direction: PredictionDirection;
  readonly description: string;
}

export interface ForecastStrategyResult {
  readonly score: number;
  readonly prediction: ForecastPrediction;
  readonly factors: readonly ForecastStrategyFactor[];
  readonly summary: string;
}
