import type {
  ForecastType,
  MetricType,
  PredictionDirection,
  RiskLevel,
} from "@ai-oracle/shared";

import type { ForecastRiskReason } from "../calculations/index.ts";

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
  readonly confidence: number;
  readonly risk: RiskLevel;
  readonly riskReason: ForecastRiskReason;
  readonly factors: readonly ForecastStrategyFactor[];
  readonly summary: string;
}
