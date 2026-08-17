import type {
  DeveloperInterestForecastDto,
  DeveloperInterestRefreshDto,
  ForecastEntity,
  ForecastHistoryItemDto,
  ForecastKind,
  ForecastStatus,
  ForecastType,
  ProjectForecastDto,
  ProjectForecastRefreshDto,
} from "@ai-oracle/shared";

import {
  DeveloperInterestApiErrorCode,
  ForecastHistoryApiErrorCode,
  ProjectForecastApiErrorCode,
} from "@ai-oracle/shared";

import { apiRequest } from "./httpClient";

export interface ForecastHistoryFilters {
  entityId?: string;
  forecastType?: ForecastType;
  status?: ForecastStatus;
  forecastKind?: ForecastKind;
}

function createHistoryQuery(filters: ForecastHistoryFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.entityId !== undefined) {
    searchParams.set("entityId", filters.entityId);
  }

  if (filters.forecastType !== undefined) {
    searchParams.set("forecastType", filters.forecastType);
  }

  if (filters.status !== undefined) {
    searchParams.set("status", filters.status);
  }

  if (filters.forecastKind !== undefined) {
    searchParams.set("forecastKind", filters.forecastKind);
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export function getEntities(): Promise<readonly ForecastEntity[]> {
  return apiRequest<readonly ForecastEntity[]>("/api/entities");
}

export function getProjectForecast(
  entityId: string,
): Promise<ProjectForecastDto> {
  const encodedEntityId = encodeURIComponent(entityId);

  return apiRequest<ProjectForecastDto, ProjectForecastApiErrorCode>(
    `/api/entities/${encodedEntityId}/forecast`,
  );
}

export function refreshProjectForecast(
  entityId: string,
): Promise<ProjectForecastRefreshDto> {
  const encodedEntityId = encodeURIComponent(entityId);

  return apiRequest<ProjectForecastRefreshDto, ProjectForecastApiErrorCode>(
    `/api/entities/${encodedEntityId}/forecast/refresh`,
    {
      method: "POST",
    },
  );
}

export function getDeveloperInterestForecast(): Promise<DeveloperInterestForecastDto> {
  return apiRequest<
    DeveloperInterestForecastDto,
    DeveloperInterestApiErrorCode
  >("/api/developer-interest/forecast");
}

export function refreshDeveloperInterestForecast(): Promise<DeveloperInterestRefreshDto> {
  return apiRequest<DeveloperInterestRefreshDto, DeveloperInterestApiErrorCode>(
    "/api/developer-interest/forecast/refresh",
    {
      method: "POST",
    },
  );
}

export function getForecastHistory(
  filters: ForecastHistoryFilters = {},
): Promise<readonly ForecastHistoryItemDto[]> {
  const query = createHistoryQuery(filters);

  return apiRequest<
    readonly ForecastHistoryItemDto[],
    ForecastHistoryApiErrorCode
  >(`/api/forecasts/history${query}`);
}
