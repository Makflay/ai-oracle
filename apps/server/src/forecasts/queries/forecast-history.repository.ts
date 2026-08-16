import type {
  ForecastType,
  ForecastStatus,
  ForecastKind,
} from "@ai-oracle/shared";

import type { ForecastHistoryItem } from "./forecast-history.types.js";

export interface FindForecastHistoryInput {
  readonly entityId?: string | undefined;
  readonly forecastType?: ForecastType | undefined;
  readonly status?: ForecastStatus | undefined;
  readonly forecastKind?: ForecastKind | undefined;
}

export interface ForecastHistoryRepository {
  findHistory(
    input: FindForecastHistoryInput,
  ): Promise<readonly ForecastHistoryItem[]>;
}
