import type { ProjectForecastDto } from "@ai-oracle/shared";

import type { ForecastSnapshot } from "../queries/index.js";

export const toProjectForecastDto = (
  forecast: ForecastSnapshot,
): ProjectForecastDto => ({
  id: forecast.id,
  entityId: forecast.entityId,
  forecastType: forecast.forecastType,
  score: forecast.score,
  confidence: forecast.confidence,
  risk: forecast.risk,
  prediction: forecast.prediction,
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
