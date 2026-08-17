import type { ForecastHistoryItemDto } from "@ai-oracle/shared";

import type { ForecastHistoryItem } from "../queries/index.js";

export const toForecastHistoryItemDto = (
  forecast: ForecastHistoryItem,
): ForecastHistoryItemDto => ({
  id: forecast.id,
  entityId: forecast.entityId,
  forecastType: forecast.forecastType,
  status: forecast.status,
  score: forecast.score,
  confidence: forecast.confidence,
  risk: forecast.risk,
  prediction: forecast.prediction,
  predictedValue: forecast.predictedValue,
  summary: forecast.summary,
  targetAt: forecast.targetAt.toISOString(),
  createdAt: forecast.createdAt.toISOString(),
  forecastKind: forecast.forecastKind,
  outcome: forecast.outcome
    ? {
        actualValue: forecast.outcome.actualValue,
        expectedValue: forecast.outcome.expectedValue,
        status: forecast.outcome.status,
        evaluatedAt: forecast.outcome.evaluatedAt.toISOString(),
      }
    : null,
});
