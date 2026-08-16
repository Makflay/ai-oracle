import type { DueForecastRepository } from "./due-forecast.repository.js";

import type { DueForecast } from "./due-forecast.types.js";

export class DueForecastService {
  constructor(private readonly repository: DueForecastRepository) {}

  async getDueForecasts(
    now: Date = new Date(),
  ): Promise<readonly DueForecast[]> {
    if (Number.isNaN(now.getTime())) {
      throw new Error("Due forecast date must be valid");
    }

    return this.repository.findDue({
      dueAt: now,
    });
  }
}
