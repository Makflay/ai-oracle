import type { DueForecast } from "./due-forecast.types.js";

export interface FindDueForecastsInput {
  readonly dueAt: Date;
}

export interface DueForecastRepository {
  findDue(input: FindDueForecastsInput): Promise<readonly DueForecast[]>;
}
