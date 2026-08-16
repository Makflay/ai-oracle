import type { ForecastType } from "@ai-oracle/shared";

import type { ForecastSnapshot } from "./current-forecast.types.js";

export interface FindCurrentForecastInput {
  entityId: string;
  forecastType: ForecastType;
}

export interface CurrentForecastRepository {
  findCurrent(
    input: FindCurrentForecastInput,
  ): Promise<ForecastSnapshot | null>;
}
