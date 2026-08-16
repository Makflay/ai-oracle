import type {
  ForecastStatus,
  ForecastType,
  PredictionDirection,
  RiskLevel,
} from "../domain/index.js";

export enum ForecastHistoryApiErrorCode {
  InvalidFilters = "INVALID_HISTORY_FILTERS",
  InternalError = "INTERNAL_ERROR",
}

export interface ForecastHistoryOutcomeDto {
  actualDirection: PredictionDirection;
  actualValue: number | null;
  accuracyScore: number | null;
  observedAt: string;
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
}
