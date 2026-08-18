import { ProjectPopularityPrediction } from "@ai-oracle/shared";

import type { ProjectForecastDto } from "@ai-oracle/shared";

import type { ForecastSnapshot } from "../queries/index.js";

const isProjectPopularityPrediction = (
  prediction: string,
): prediction is ProjectPopularityPrediction =>
  Object.values(ProjectPopularityPrediction).some(
    (value) => value === prediction,
  );

export const toForecastDtoBase = (
  forecast: ForecastSnapshot,
): Omit<ProjectForecastDto, "prediction"> => ({
  id: forecast.id,
  entityId: forecast.entityId,
  forecastType: forecast.forecastType,
  score: forecast.score,
  confidence: forecast.confidence,
  risk: forecast.risk,
  predictedValue: forecast.predictedValue,
  targetAt: forecast.targetAt.toISOString(),
  createdAt: forecast.createdAt.toISOString(),
  summary: forecast.explainability.summary,
  riskReason: {
    code: forecast.explainability.riskReason.code,
    message: forecast.explainability.riskReason.message,
  },
  factors: forecast.factors.map((factor) => ({
    id: factor.id,
    metricId: factor.metricId,
    sourceKey: factor.sourceKey,
    metricType: factor.metricType,
    rawValue: factor.rawValue,
    normalizedValue: factor.normalizedValue,
    weight: factor.weight,
    contribution: factor.contribution,
    direction: factor.direction,
    description: factor.description,
    position: factor.position,
  })),
  sourceData: forecast.sourceData.map((source) => ({
    sourceKey: source.sourceKey,
    fetchedAt: source.fetchedAt.toISOString(),
    freshnessStatus: source.freshnessStatus,
  })),
  outcome: forecast.outcome
    ? {
        actualValue: forecast.outcome.actualValue,
        expectedValue: forecast.outcome.expectedValue,
        status: forecast.outcome.status,
        evaluatedAt: forecast.outcome.evaluatedAt.toISOString(),
      }
    : null,
  forecastKind: forecast.forecastKind,
});

export const toProjectForecastDto = (
  forecast: ForecastSnapshot,
): ProjectForecastDto => {
  if (!isProjectPopularityPrediction(forecast.prediction)) {
    throw new Error(
      `Invalid project popularity prediction "${forecast.prediction}"`,
    );
  }

  return {
    ...toForecastDtoBase(forecast),
    prediction: forecast.prediction,
  };
};
