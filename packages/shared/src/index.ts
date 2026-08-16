export enum ApiStatus {
  Success = "success",
  Error = "error",
}

export interface ApiSuccessResponse<TData> {
  status: ApiStatus.Success;
  data: TData;
}

export interface ApiErrorResponse<TCode extends string = string> {
  status: ApiStatus.Error;
  error: {
    code: TCode;
    message: string;
  };
}

export type ApiResponse<TData, TCode extends string = string> =
  | ApiSuccessResponse<TData>
  | ApiErrorResponse<TCode>;

export {
  ForecastStatus,
  ForecastType,
  MetricType,
  PredictionDirection,
  RiskLevel,
  DeveloperInterestPrediction,
  ProjectPopularityPrediction,
} from "./domain/index.js";

export type {
  EntityId,
  Forecast,
  ForecastEntity,
  ForecastExplanation,
  ForecastFactor,
  ForecastId,
  ForecastResult,
  Metric,
  MetricId,
} from "./domain/index.js";

export {
  ProjectForecastApiErrorCode,
  DeveloperInterestApiErrorCode,
  ForecastHistoryApiErrorCode,
} from "./api/index.js";

export type {
  ProjectForecastDto,
  ProjectForecastFactorDto,
  ProjectForecastOutcomeDto,
  ProjectForecastRefreshDto,
  ProjectForecastRiskReasonDto,
  DeveloperInterestForecastDto,
  DeveloperInterestRefreshDto,
  ForecastHistoryItemDto,
  ForecastHistoryOutcomeDto,
} from "./api/index.js";
