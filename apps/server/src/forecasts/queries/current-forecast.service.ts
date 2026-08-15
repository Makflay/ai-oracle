import type { CurrentForecast } from "./current-forecast.types.js";

import type {
  CurrentForecastRepository,
  FindCurrentForecastInput,
} from "./current-forecast.repository.js";

export class CurrentForecastService {
  constructor(private readonly repository: CurrentForecastRepository) {}

  async getCurrent(
    input: FindCurrentForecastInput,
  ): Promise<CurrentForecast | null> {
    if (input.entityId.trim().length === 0) {
      throw new Error("Current forecast entityId is required");
    }

    return this.repository.findCurrent(input);
  }
}
