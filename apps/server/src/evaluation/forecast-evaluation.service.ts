import type { RawIngestionOptions } from "../ingestion/index.js";

import { ActualMetricsService } from "./actual-metrics.service.js";
import { DueForecastService } from "./due-forecast.service.js";
import type { DueForecast } from "./due-forecast.types.js";

import { evaluateForecast } from "./forecast-evaluator.js";

import { ForecastOutcomeAlreadyExistsError } from "./forecast-outcome.errors.js";
import type { StoredForecastOutcome } from "./forecast-outcome.persistence.js";
import { ForecastOutcomeService } from "./forecast-outcome.service.js";

export interface EvaluateDueForecastsInput {
  readonly now?: Date;
  readonly ingestionOptions?: RawIngestionOptions;
}

export interface ForecastEvaluationFailure {
  readonly forecastId: string;
  readonly message: string;
}

export interface EvaluateDueForecastsResult {
  readonly dueCount: number;
  readonly evaluatedCount: number;
  readonly alreadyEvaluatedCount: number;
  readonly failedCount: number;
  readonly outcomes: readonly StoredForecastOutcome[];
  readonly failures: readonly ForecastEvaluationFailure[];
}

export class ForecastEvaluationService {
  constructor(
    private readonly dueForecasts: DueForecastService,
    private readonly actualMetrics: ActualMetricsService,
    private readonly outcomes: ForecastOutcomeService,
  ) {}

  async evaluateDueForecasts(
    input: EvaluateDueForecastsInput = {},
  ): Promise<EvaluateDueForecastsResult> {
    const now = input.now ?? new Date();

    if (Number.isNaN(now.getTime())) {
      throw new Error("Forecast evaluation date must be valid");
    }

    const dueForecasts = await this.dueForecasts.getDueForecasts(now);

    const storedOutcomes: StoredForecastOutcome[] = [];
    const failures: ForecastEvaluationFailure[] = [];

    let alreadyEvaluatedCount = 0;

    for (const forecast of dueForecasts) {
      try {
        const outcome = await this.evaluateOne(
          forecast,
          input.ingestionOptions,
        );

        storedOutcomes.push(outcome);
      } catch (error: unknown) {
        if (error instanceof ForecastOutcomeAlreadyExistsError) {
          alreadyEvaluatedCount += 1;
          continue;
        }

        failures.push({
          forecastId: forecast.id,
          message:
            error instanceof Error
              ? error.message
              : "Unknown forecast evaluation error",
        });
      }
    }

    return {
      dueCount: dueForecasts.length,
      evaluatedCount: storedOutcomes.length,
      alreadyEvaluatedCount,
      failedCount: failures.length,
      outcomes: storedOutcomes,
      failures,
    };
  }

  private async evaluateOne(
    forecast: DueForecast,
    ingestionOptions?: RawIngestionOptions,
  ): Promise<StoredForecastOutcome> {
    const actual = await this.actualMetrics.collect({
      target: {
        forecastId: forecast.id,
        entityId: forecast.entityId,
        entitySlug: forecast.entitySlug,
        targetAt: forecast.targetAt,
        factors: forecast.factors,
      },
      ...(ingestionOptions ? { ingestionOptions } : {}),
    });

    const evaluation = evaluateForecast({
      forecast: {
        id: forecast.id,
        entitySlug: forecast.entitySlug,
        prediction: forecast.prediction,
        score: forecast.score,
        predictedValue: forecast.predictedValue,
        factors: forecast.factors,
        forecastKind: forecast.forecastKind,
      },
      actual,
    });

    return this.outcomes.save(evaluation);
  }
}
