export enum ApiStatus {
  Success = "success",
  Error = "error",
}

export interface ApiSuccessResponse<TData> {
  status: ApiStatus.Success;
  data: TData;
}

export interface ApiErrorResponse {
  status: ApiStatus.Error;
  error: {
    message: string;
  };
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export {
  ForecastStatus,
  ForecastType,
  MetricType,
  PredictionDirection,
  RiskLevel,
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
