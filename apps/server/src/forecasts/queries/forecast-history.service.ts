import type {
  FindForecastHistoryInput,
  ForecastHistoryRepository,
} from "./forecast-history.repository.js";

import type { ForecastSnapshot } from "./current-forecast.types.js";

export class ForecastHistoryService {
  constructor(private readonly repository: ForecastHistoryRepository) {}

  async getHistory(
    input: FindForecastHistoryInput,
  ): Promise<readonly ForecastSnapshot[]> {
    if (input.entityId.trim().length === 0) {
      throw new Error("Forecast history entityId is required");
    }

    return this.repository.findHistory(input);
  }
}
