import type { DeveloperInterestPrediction } from "../domain/index.js";

import type { ProjectForecastDto } from "./project-forecast.js";

export enum DeveloperInterestApiErrorCode {
  EntityNotFound = "DEVELOPER_INTEREST_ENTITY_NOT_FOUND",
  ForecastNotFound = "DEVELOPER_INTEREST_FORECAST_NOT_FOUND",
  InvalidPrediction = "INVALID_DEVELOPER_INTEREST_PREDICTION",
  RefreshFailed = "DEVELOPER_INTEREST_REFRESH_FAILED",
  InternalError = "INTERNAL_ERROR",
}

export type DeveloperInterestForecastDto = Omit<
  ProjectForecastDto,
  "prediction"
> & {
  prediction: DeveloperInterestPrediction;
};

export interface DeveloperInterestRefreshDto {
  forecast: DeveloperInterestForecastDto;
  refreshed: boolean;
}
