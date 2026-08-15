import { DeveloperInterestPrediction } from "@ai-oracle/shared";

import type { DeveloperInterestForecastDto } from "@ai-oracle/shared";

import type { ForecastSnapshot } from "../queries/index.js";

import { toProjectForecastDto } from "./project-forecast.mapper.js";

const isDeveloperInterestPrediction = (
  prediction: string,
): prediction is DeveloperInterestPrediction =>
  Object.values(DeveloperInterestPrediction).some(
    (value) => value === prediction,
  );

export const toDeveloperInterestForecastDto = (
  forecast: ForecastSnapshot,
): DeveloperInterestForecastDto => {
  if (!isDeveloperInterestPrediction(forecast.prediction)) {
    throw new Error(
      `Invalid developer interest prediction "${forecast.prediction}"`,
    );
  }

  return {
    ...toProjectForecastDto(forecast),
    prediction: forecast.prediction,
  };
};
