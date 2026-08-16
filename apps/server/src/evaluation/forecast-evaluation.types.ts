import type {
  DeveloperInterestPrediction,
  ProjectPopularityPrediction,
  EvaluationStatus,
} from "@ai-oracle/shared";

import type { ActualMetricsResult } from "./actual-metrics.types.js";

import type { DueForecastFactor } from "./due-forecast.types.js";

export enum EvaluationForecastKind {
  ProjectPopularity = "PROJECT_POPULARITY",
  DeveloperInterest = "DEVELOPER_INTEREST",
}

export interface EvaluationForecastSnapshot {
  readonly id: string;
  readonly entitySlug: string;
  readonly prediction: string;
  readonly predictedValue: number | null;
  readonly factors: readonly DueForecastFactor[];
}

export interface EvaluateForecastInput {
  readonly forecast: EvaluationForecastSnapshot;
  readonly actual: ActualMetricsResult;
}

export type EvaluationPrediction =
  | ProjectPopularityPrediction
  | DeveloperInterestPrediction;

export interface ForecastEvaluationResult {
  readonly forecastId: string;
  readonly kind: EvaluationForecastKind;
  readonly status: EvaluationStatus;
  readonly expectedPrediction: EvaluationPrediction;
  readonly actualPrediction: EvaluationPrediction;
  readonly predictedValue: number;
  readonly actualValue: number;
  readonly absoluteError: number;
  readonly evaluatedAt: Date;
}
