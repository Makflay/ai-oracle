import type {
  ForecastStatus,
  ForecastType,
  RiskLevel,
  MetricType,
} from "@ai-oracle/shared";

export interface DueForecast {
  readonly id: string;
  readonly entityId: string;
  readonly forecastType: ForecastType;
  readonly status: ForecastStatus;
  readonly score: number;
  readonly confidence: number | null;
  readonly risk: RiskLevel;
  readonly prediction: string;
  readonly predictedValue: number | null;
  readonly targetAt: Date;
  readonly createdAt: Date;
}

export interface DueForecastFactor {
  readonly id: string;
  readonly metricId: string | null;
  readonly sourceKey: string;
  readonly metricType: MetricType;
  readonly position: number;
  readonly entitySlug: string;
  readonly factors: readonly DueForecastFactor[];
  readonly normalizedValue: number;
  readonly weight: number;
  readonly contribution: number;
}
