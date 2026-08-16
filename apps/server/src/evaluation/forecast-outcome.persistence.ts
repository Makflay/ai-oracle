import type { EvaluationStatus } from "@ai-oracle/shared";

export interface CreateForecastOutcome {
  readonly forecastId: string;
  readonly actualValue: number;
  readonly expectedValue: number;
  readonly status: EvaluationStatus;
  readonly evaluatedAt: Date;
}

export interface StoredForecastOutcome {
  readonly id: string;
  readonly forecastId: string;
  readonly actualValue: number;
  readonly expectedValue: number;
  readonly status: EvaluationStatus;
  readonly evaluatedAt: Date;
  readonly createdAt: Date;
}

export interface ForecastOutcomePersistence {
  create(outcome: CreateForecastOutcome): Promise<StoredForecastOutcome>;
}
