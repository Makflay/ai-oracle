import type { ForecastType, ForecastKind } from "@ai-oracle/shared";

import type { ForecastSnapshot } from "./current-forecast.types.js";

export interface FindCurrentForecastInput {
  entityId: string;
  forecastType: ForecastType;
  forecastKind: ForecastKind;
}

export interface CurrentForecastRepository {
  findCurrent(
    input: FindCurrentForecastInput,
  ): Promise<ForecastSnapshot | null>;
}
