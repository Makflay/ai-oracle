import type { ForecastType } from "@ai-oracle/shared";

import type { CurrentForecast } from "./current-forecast.types.js";

export interface FindCurrentForecastInput {
  entityId: string;
  forecastType: ForecastType;
}

export interface CurrentForecastRepository {
  findCurrent(input: FindCurrentForecastInput): Promise<CurrentForecast | null>;
}
