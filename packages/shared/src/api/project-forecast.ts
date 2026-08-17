import type {
  ForecastType,
  MetricType,
  PredictionDirection,
  RiskLevel,
  EvaluationStatus,
  ForecastKind,
  ProjectPopularityPrediction,
} from "../domain/index.js";

export enum ProjectForecastApiErrorCode {
  InvalidEntityId = "INVALID_ENTITY_ID",
  EntityNotFound = "ENTITY_NOT_FOUND",
  EntityIsNotProject = "ENTITY_IS_NOT_PROJECT",
  ForecastNotFound = "FORECAST_NOT_FOUND",
  RefreshFailed = "REFRESH_FAILED",
  InternalError = "INTERNAL_ERROR",
}

export interface ProjectForecastRiskReasonDto {
  code: string;
  message: string;
}

export interface ProjectForecastFactorDto {
  id: string;
  metricId: string | null;
  sourceKey: string;
  metricType: MetricType;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  contribution: number;
  direction: PredictionDirection | null;
  description: string;
  position: number;
}

export interface ProjectForecastOutcomeDto {
  expectedValue: number;
  actualValue: number;
  status: EvaluationStatus;
  evaluatedAt: string;
}

export enum SourceDataFreshnessStatus {
  Fresh = "FRESH",
  Stale = "STALE",
}

export interface ProjectForecastSourceDataDto {
  sourceKey: string;
  fetchedAt: string;
  freshnessStatus: SourceDataFreshnessStatus;
}

export interface ProjectForecastDto {
  id: string;
  entityId: string;
  forecastType: ForecastType;
  score: number;
  confidence: number | null;
  risk: RiskLevel;
  prediction: ProjectPopularityPrediction;
  predictedValue: number | null;
  targetAt: string;
  createdAt: string;
  summary: string;
  riskReason: ProjectForecastRiskReasonDto;
  factors: readonly ProjectForecastFactorDto[];
  outcome: ProjectForecastOutcomeDto | null;
  forecastKind: ForecastKind;
  sourceData: readonly ProjectForecastSourceDataDto[];
}

export interface ProjectForecastRefreshDto {
  forecast: ProjectForecastDto;
  refreshed: boolean;
}
