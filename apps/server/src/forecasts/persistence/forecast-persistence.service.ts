import type { ForecastType } from "@ai-oracle/shared";

import type { ForecastStrategyResult } from "../contracts/index.js";

import type {
  ForecastPersistence,
  StoredForecastSnapshot,
} from "../persistence/index.js";

export interface SaveForecastSnapshotInput<
  TPrediction extends string = string,
> {
  entityId: string;
  forecastType: ForecastType;
  targetAt: string;
  result: ForecastStrategyResult<TPrediction>;
  createdAt?: Date;
}

export class ForecastPersistenceService {
  constructor(private readonly persistence: ForecastPersistence) {}

  async save<TPrediction extends string>(
    input: SaveForecastSnapshotInput<TPrediction>,
  ): Promise<StoredForecastSnapshot> {
    const targetAt = new Date(input.targetAt);
    const createdAt = input.createdAt ?? new Date();

    if (Number.isNaN(targetAt.getTime())) {
      throw new Error("Forecast targetAt must be a valid date");
    }

    if (Number.isNaN(createdAt.getTime())) {
      throw new Error("Forecast createdAt must be a valid date");
    }

    return this.persistence.create({
      entityId: input.entityId,
      forecastType: input.forecastType,
      score: input.result.score,
      confidence: input.result.confidence,
      risk: input.result.risk,
      prediction: input.result.prediction,
      predictedValue: input.result.predictedValue,
      targetAt,
      createdAt,
      explainability: {
        summary: input.result.summary,
        riskReason: input.result.riskReason,
      },
      factors: input.result.factors.map((factor, position) => ({
        metricId: factor.metricId,
        sourceKey: factor.sourceKey,
        metricType: factor.metricType,
        rawValue: factor.rawValue,
        normalizedValue: factor.normalizedValue,
        weight: factor.weight,
        contribution: factor.contribution,
        direction: factor.direction ?? null,
        description: factor.description,
        position,
      })),
    });
  }
}
