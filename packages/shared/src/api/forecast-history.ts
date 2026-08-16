import type {
  ForecastStatus,
  ForecastType,
  EvaluationStatus,
  RiskLevel,
  ForecastKind,
} from "../domain/index.js";

export enum ForecastHistoryApiErrorCode {
  InvalidFilters = "INVALID_HISTORY_FILTERS",
  InternalError = "INTERNAL_ERROR",
}

export interface ForecastHistoryOutcomeDto {
  expectedValue: number;
  actualValue: number | null;
  status: EvaluationStatus;
  evaluatedAt: string;
}

export interface ForecastHistoryItemDto {
  id: string;
  entityId: string;
  forecastType: ForecastType;
  status: ForecastStatus;
  score: number;
  confidence: number | null;
  risk: RiskLevel;
  prediction: string;
  predictedValue: number | null;
  summary: string;
  targetAt: string;
  createdAt: string;
  outcome: ForecastHistoryOutcomeDto | null;
  forecastKind: ForecastKind;
}
