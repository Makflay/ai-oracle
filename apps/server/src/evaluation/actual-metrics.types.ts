import type { MetricType } from "@ai-oracle/shared";

import type {
  RawIngestionFailure,
  RawIngestionOptions,
} from "../ingestion/index.js";

import type { DueForecast, DueForecastFactor } from "./due-forecast.types.js";

export interface ActualForecastMetric {
  readonly forecastFactorId: string;
  readonly originalMetricId: string | null;
  readonly actualMetricId: string;
  readonly sourceKey: string;
  readonly metricType: MetricType;
  readonly rawValue: number;
  readonly normalizedValue: number;
  readonly recordedAt: Date;
}

export interface MissingActualMetric {
  readonly forecastFactorId: string;
  readonly sourceKey: string;
  readonly metricType: MetricType;
}

export interface ActualMetricsTarget {
  readonly forecastId: string;
  readonly entityId: string;
  readonly entitySlug: string;
  readonly targetAt: Date;
  readonly factors: readonly DueForecastFactor[];
}

export interface CollectActualMetricsInput {
  readonly target: ActualMetricsTarget;
  readonly ingestionOptions?: RawIngestionOptions;
}

export interface ActualMetricsResult {
  readonly forecastId: string;
  readonly entityId: string;
  readonly targetAt: Date;
  readonly evaluatedAt: Date;
  readonly actualMetrics: readonly ActualForecastMetric[];
  readonly missingMetrics: readonly MissingActualMetric[];
  readonly ingestionFailures: readonly RawIngestionFailure[];
}

export interface ActualMetricsTarget {
  readonly forecastId: string;
  readonly entityId: string;
  readonly entitySlug: string;
  readonly targetAt: Date;
  readonly factors: readonly DueForecastFactor[];
}

export interface CollectActualMetricsInput {
  readonly target: ActualMetricsTarget;
  readonly ingestionOptions?: RawIngestionOptions;
}
