import type { ForecastType } from "@ai-oracle/shared";

import type { ForecastSnapshot } from "./current-forecast.types.js";

export interface FindForecastHistoryInput {
  entityId: string;
  forecastType: ForecastType;
}

export interface ForecastHistoryRepository {
  findHistory(
    input: FindForecastHistoryInput,
  ): Promise<readonly ForecastSnapshot[]>;
}
