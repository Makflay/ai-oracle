import {
  DeveloperInterestPrediction,
  ProjectPopularityPrediction,
  ForecastKind,
} from "@ai-oracle/shared";

import { EvaluationStatus } from "@ai-oracle/shared";

import {
  determineDeveloperInterestPrediction,
  determineProjectPopularityPrediction,
} from "../forecasts/index.js";

import {
  ForecastNotEvaluableError,
  IncompleteActualMetricsError,
} from "./forecast-evaluation.errors.js";

import { EvaluationForecastKind } from "./forecast-evaluation.types.js";

import type {
  EvaluateForecastInput,
  EvaluationPrediction,
  ForecastEvaluationResult,
} from "./forecast-evaluation.types.js";

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const clampScore = (value: number): number =>
  Math.min(100, Math.max(0, roundToTwoDecimals(value)));

const isProjectPrediction = (
  value: string,
): value is ProjectPopularityPrediction =>
  Object.values(ProjectPopularityPrediction).some(
    (prediction) => prediction === value,
  );

const isDeveloperPrediction = (
  value: string,
): value is DeveloperInterestPrediction =>
  Object.values(DeveloperInterestPrediction).some(
    (prediction) => prediction === value,
  );

export const evaluateForecast = (
  input: EvaluateForecastInput,
): ForecastEvaluationResult => {
  const { forecast, actual } = input;

  if (forecast.id !== actual.forecastId) {
    throw new ForecastNotEvaluableError(
      "Actual metrics belong to another forecast",
    );
  }

  if (
    forecast.predictedValue === null ||
    !Number.isFinite(forecast.predictedValue)
  ) {
    throw new ForecastNotEvaluableError(
      `Forecast "${forecast.id}" has no valid predictedValue`,
    );
  }

  if (forecast.factors.length === 0) {
    throw new ForecastNotEvaluableError(
      `Forecast "${forecast.id}" has no factors`,
    );
  }

  const actualByFactorId = new Map(
    actual.actualMetrics.map((metric) => [metric.forecastFactorId, metric]),
  );

  const missingFactorIds = forecast.factors
    .filter((factor) => !actualByFactorId.has(factor.id))
    .map((factor) => factor.id);

  if (missingFactorIds.length > 0) {
    throw new IncompleteActualMetricsError(missingFactorIds);
  }

  const actualValue = clampScore(
    forecast.factors.reduce((total, factor) => {
      const actualMetric = actualByFactorId.get(factor.id);

      if (!actualMetric) {
        return total;
      }

      return total + actualMetric.normalizedValue * factor.weight;
    }, 0),
  );

  const kind =
    forecast.forecastKind === ForecastKind.DeveloperInterest
      ? EvaluationForecastKind.DeveloperInterest
      : EvaluationForecastKind.ProjectPopularity;

  const expectedPrediction = validateExpectedPrediction(
    kind,
    forecast.prediction,
  );

  const actualPrediction = determineActualPrediction(
    kind,
    actualValue,
    forecast.score,
  );

  return {
    forecastId: forecast.id,
    kind,
    status:
      expectedPrediction === actualPrediction
        ? EvaluationStatus.Correct
        : EvaluationStatus.Incorrect,
    expectedPrediction,
    actualPrediction,
    predictedValue: roundToTwoDecimals(forecast.predictedValue),
    actualValue,
    absoluteError: roundToTwoDecimals(
      Math.abs(actualValue - forecast.predictedValue),
    ),
    evaluatedAt: actual.evaluatedAt,
  };
};

const validateExpectedPrediction = (
  kind: EvaluationForecastKind,
  prediction: string,
): EvaluationPrediction => {
  if (kind === EvaluationForecastKind.DeveloperInterest) {
    if (isDeveloperPrediction(prediction)) {
      return prediction;
    }

    throw new ForecastNotEvaluableError(
      `Invalid Developer Interest prediction "${prediction}"`,
    );
  }

  if (isProjectPrediction(prediction)) {
    return prediction;
  }

  throw new ForecastNotEvaluableError(
    `Invalid Project Popularity prediction "${prediction}"`,
  );
};

const determineActualPrediction = (
  kind: EvaluationForecastKind,
  actualValue: number,
  forecastCurrentValue: number,
): EvaluationPrediction => {
  if (kind === EvaluationForecastKind.DeveloperInterest) {
    return determineDeveloperInterestPrediction(actualValue);
  }

  const actualDelta = roundToTwoDecimals(actualValue - forecastCurrentValue);

  return determineProjectPopularityPrediction(actualDelta);
};
