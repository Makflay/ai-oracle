import type { ForecastEvaluationResult } from "./forecast-evaluation.types.js";

import type {
  ForecastOutcomePersistence,
  StoredForecastOutcome,
} from "./forecast-outcome.persistence.js";

export class ForecastOutcomeService {
  constructor(private readonly persistence: ForecastOutcomePersistence) {}

  async save(
    evaluation: ForecastEvaluationResult,
  ): Promise<StoredForecastOutcome> {
    if (!Number.isFinite(evaluation.actualValue)) {
      throw new Error("Evaluation actualValue must be finite");
    }

    if (!Number.isFinite(evaluation.predictedValue)) {
      throw new Error("Evaluation predictedValue must be finite");
    }

    if (Number.isNaN(evaluation.evaluatedAt.getTime())) {
      throw new Error("Evaluation evaluatedAt must be valid");
    }

    return this.persistence.create({
      forecastId: evaluation.forecastId,
      actualValue: evaluation.actualValue,
      expectedValue: evaluation.predictedValue,
      status: evaluation.status,
      evaluatedAt: evaluation.evaluatedAt,
    });
  }
}
