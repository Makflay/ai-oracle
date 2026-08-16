import type {
  FindForecastHistoryInput,
  ForecastHistoryRepository,
} from "./forecast-history.repository.js";

import type { ForecastHistoryItem } from "./forecast-history.types.js";

export class ForecastHistoryService {
  constructor(private readonly repository: ForecastHistoryRepository) {}

  async getHistory(
    input: FindForecastHistoryInput,
  ): Promise<readonly ForecastHistoryItem[]> {
    return this.repository.findHistory(input);
  }
}
