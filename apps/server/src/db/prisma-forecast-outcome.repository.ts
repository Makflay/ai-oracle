import {
  EvaluationStatus as PrismaEvaluationStatus,
  Prisma,
} from "../generated/prisma/client.js";

import { EvaluationStatus } from "@ai-oracle/shared";

import type {
  CreateForecastOutcome,
  ForecastOutcomePersistence,
  StoredForecastOutcome,
} from "../evaluation/forecast-outcome.persistence.js";

import { ForecastOutcomeAlreadyExistsError } from "../evaluation/forecast-outcome.errors.js";

import { prisma } from "./client.js";

const toPrismaEvaluationStatus = (
  status: EvaluationStatus,
): PrismaEvaluationStatus => {
  switch (status) {
    case EvaluationStatus.Correct:
      return PrismaEvaluationStatus.CORRECT;

    case EvaluationStatus.Incorrect:
      return PrismaEvaluationStatus.INCORRECT;
  }
};

const toDomainEvaluationStatus = (
  status: PrismaEvaluationStatus,
): EvaluationStatus => {
  switch (status) {
    case PrismaEvaluationStatus.CORRECT:
      return EvaluationStatus.Correct;

    case PrismaEvaluationStatus.INCORRECT:
      return EvaluationStatus.Incorrect;
  }
};

const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

export class PrismaForecastOutcomeRepository implements ForecastOutcomePersistence {
  async create(outcome: CreateForecastOutcome): Promise<StoredForecastOutcome> {
    try {
      const stored = await prisma.forecastOutcome.create({
        data: {
          forecastId: outcome.forecastId,
          actualValue: new Prisma.Decimal(outcome.actualValue),
          expectedValue: new Prisma.Decimal(outcome.expectedValue),
          status: toPrismaEvaluationStatus(outcome.status),
          evaluatedAt: outcome.evaluatedAt,
        },
      });

      if (stored.actualValue === null) {
        throw new Error(`ForecastOutcome "${stored.id}" has no actualValue`);
      }

      return {
        id: stored.id,
        forecastId: stored.forecastId,
        actualValue: stored.actualValue.toNumber(),
        expectedValue: stored.expectedValue.toNumber(),
        status: toDomainEvaluationStatus(stored.status),
        evaluatedAt: stored.evaluatedAt,
        createdAt: stored.createdAt,
      };
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ForecastOutcomeAlreadyExistsError(outcome.forecastId);
      }

      throw error;
    }
  }
}
