import type { ForecastType, ForecastStatus } from "@ai-oracle/shared";

import type { ForecastHistoryItem } from "./forecast-history.types.js";

export interface FindForecastHistoryInput {
  readonly entityId?: string | undefined;
  readonly forecastType?: ForecastType | undefined;
  readonly status?: ForecastStatus | undefined;
}

export interface ForecastHistoryRepository {
  findHistory(
    input: FindForecastHistoryInput,
  ): Promise<readonly ForecastHistoryItem[]>;
}
