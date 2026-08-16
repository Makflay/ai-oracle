import {
  ForecastType as PrismaForecastType,
  Prisma,
  RiskLevel as PrismaRiskLevel,
  MetricType as PrismaMetricType,
  PredictionDirection as PrismaPredictionDirection,
  ForecastStatus as PrismaForecastStatus,
  EvaluationStatus as PrismaEvaluationStatus,
  ForecastKind as PrismaForecastKind,
} from "../generated/prisma/client.js";

import { prisma } from "./client.js";

import {
  toDomainEvaluationStatus,
  toDomainForecastKind,
  toDomainForecastStatus,
  toDomainForecastType,
  toDomainMetricType,
  toDomainPredictionDirection,
  toDomainRiskLevel,
  toPrismaForecastKind,
  toPrismaForecastStatus,
  toPrismaForecastType,
  toPrismaMetricType,
  toPrismaPredictionDirection,
  toPrismaRiskLevel,
} from "./mappers/index.js";

import type {
  CreateForecastSnapshot,
  ForecastExplainabilityMetadata,
  ForecastPersistence,
  StoredForecastSnapshot,
  ForecastSnapshot,
  CurrentForecastRepository,
  FindCurrentForecastInput,
  FindForecastHistoryInput,
  ForecastHistoryRepository,
  ForecastHistoryItem,
  StoredForecastFactorSnapshot,
} from "../forecasts/index.ts";

const forecastSnapshotInclude = {
  factors: {
    orderBy: {
      position: "asc",
    },
  },
  outcome: true,
} satisfies Prisma.ForecastInclude;

type PrismaForecastSnapshot = Prisma.ForecastGetPayload<{
  include: typeof forecastSnapshotInclude;
}>;

const toForecastSnapshot = (
  forecast: PrismaForecastSnapshot,
): ForecastSnapshot => ({
  id: forecast.id,
  entityId: forecast.entityId,
  forecastType: toDomainForecastType(forecast.forecastType),
  score: forecast.score.toNumber(),
  confidence: forecast.confidence?.toNumber() ?? null,
  risk: toDomainRiskLevel(forecast.risk),
  prediction: forecast.prediction,
  predictedValue: forecast.predictedValue?.toNumber() ?? null,
  targetAt: forecast.targetAt,
  createdAt: forecast.createdAt,
  forecastKind: toDomainForecastKind(forecast.forecastKind),
  explainability:
    forecast.explainability as unknown as ForecastExplainabilityMetadata,
  factors: forecast.factors.map((factor) => ({
    id: factor.id,
    forecastId: factor.forecastId,
    metricId: factor.metricId,
    sourceKey: factor.sourceKey,
    metricType: toDomainMetricType(factor.metricType),
    rawValue: factor.rawValue.toNumber(),
    normalizedValue: factor.normalizedValue.toNumber(),
    weight: factor.weight.toNumber(),
    contribution: factor.contribution.toNumber(),
    direction: factor.direction
      ? toDomainPredictionDirection(factor.direction)
      : null,
    description: factor.description,
    position: factor.position,
    createdAt: factor.createdAt,
  })),
  outcome: forecast.outcome
    ? {
        id: forecast.outcome.id,
        forecastId: forecast.outcome.forecastId,
        expectedValue: forecast.outcome.expectedValue.toNumber(),
        actualValue: forecast.outcome.actualValue?.toNumber() ?? null,
        status: toDomainEvaluationStatus(forecast.outcome.status),
        evaluatedAt: forecast.outcome.evaluatedAt,
        createdAt: forecast.outcome.createdAt,
      }
    : null,
});

const forecastHistoryInclude = {
  outcome: true,
} satisfies Prisma.ForecastInclude;

type PrismaForecastHistoryItem = Prisma.ForecastGetPayload<{
  include: typeof forecastHistoryInclude;
}>;

const toForecastHistoryItem = (
  forecast: PrismaForecastHistoryItem,
): ForecastHistoryItem => {
  const explainability = forecast.explainability as unknown as {
    summary?: unknown;
  };

  return {
    id: forecast.id,
    entityId: forecast.entityId,
    forecastType: toDomainForecastType(forecast.forecastType),
    status: toDomainForecastStatus(forecast.status),
    score: forecast.score.toNumber(),
    confidence: forecast.confidence?.toNumber() ?? null,
    risk: toDomainRiskLevel(forecast.risk),
    prediction: forecast.prediction,
    predictedValue: forecast.predictedValue?.toNumber() ?? null,
    forecastKind: toDomainForecastKind(forecast.forecastKind),
    summary:
      typeof explainability.summary === "string"
        ? explainability.summary
        : (forecast.summary ?? ""),
    targetAt: forecast.targetAt,
    createdAt: forecast.createdAt,
    outcome: forecast.outcome
      ? {
          id: forecast.outcome.id,
          forecastId: forecast.outcome.forecastId,
          expectedValue: forecast.outcome.expectedValue.toNumber(),
          actualValue: forecast.outcome.actualValue?.toNumber() ?? null,
          status: toDomainEvaluationStatus(forecast.outcome.status),
          evaluatedAt: forecast.outcome.evaluatedAt,
          createdAt: forecast.outcome.createdAt,
        }
      : null,
  };
};

export class PrismaForecastRepository
  implements
    ForecastPersistence,
    CurrentForecastRepository,
    ForecastHistoryRepository
{
  async create(
    snapshot: CreateForecastSnapshot,
  ): Promise<StoredForecastSnapshot> {
    const forecast = await prisma.forecast.create({
      data: {
        entityId: snapshot.entityId,
        forecastType: toPrismaForecastType(snapshot.forecastType),
        score: new Prisma.Decimal(snapshot.score),
        confidence: new Prisma.Decimal(snapshot.confidence),
        risk: toPrismaRiskLevel(snapshot.risk),
        prediction: snapshot.prediction,
        predictedValue: new Prisma.Decimal(snapshot.predictedValue),
        targetAt: snapshot.targetAt,
        createdAt: snapshot.createdAt,
        status: PrismaForecastStatus.COMPLETED,
        completedAt: snapshot.createdAt,
        forecastKind: toPrismaForecastKind(snapshot.forecastKind),
        explainability:
          snapshot.explainability as unknown as Prisma.InputJsonValue,
        factors: {
          create: snapshot.factors.map((factor) => ({
            metricId: factor.metricId,
            sourceKey: factor.sourceKey,
            metricType: toPrismaMetricType(factor.metricType),
            rawValue: new Prisma.Decimal(factor.rawValue),
            normalizedValue: new Prisma.Decimal(factor.normalizedValue),
            weight: new Prisma.Decimal(factor.weight),
            contribution: new Prisma.Decimal(factor.contribution),
            direction: factor.direction
              ? toPrismaPredictionDirection(factor.direction)
              : null,
            description: factor.description,
            position: factor.position,
          })),
        },
      },
      include: {
        factors: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    const factors: readonly StoredForecastFactorSnapshot[] =
      forecast.factors.map((factor) => ({
        id: factor.id,
        forecastId: factor.forecastId,
        metricId: factor.metricId,
        sourceKey: factor.sourceKey,
        metricType: toDomainMetricType(factor.metricType),
        rawValue: factor.rawValue.toNumber(),
        normalizedValue: factor.normalizedValue.toNumber(),
        weight: factor.weight.toNumber(),
        contribution: factor.contribution.toNumber(),
        direction: factor.direction
          ? toDomainPredictionDirection(factor.direction)
          : null,
        description: factor.description,
        position: factor.position,
        createdAt: factor.createdAt,
      }));

    return {
      id: forecast.id,
      entityId: forecast.entityId,
      forecastType: toDomainForecastType(forecast.forecastType),
      score: forecast.score.toNumber(),
      confidence: forecast.confidence?.toNumber() ?? null,
      risk: toDomainRiskLevel(forecast.risk),
      prediction: forecast.prediction,
      predictedValue: forecast.predictedValue?.toNumber() ?? null,
      targetAt: forecast.targetAt,
      createdAt: forecast.createdAt,
      forecastKind: toDomainForecastKind(forecast.forecastKind),
      explainability:
        forecast.explainability as unknown as ForecastExplainabilityMetadata,
      factors,
    };
  }

  async findCurrent(
    input: FindCurrentForecastInput,
  ): Promise<ForecastSnapshot | null> {
    const forecast = await prisma.forecast.findFirst({
      where: {
        entityId: input.entityId,
        forecastType: toPrismaForecastType(input.forecastType),
        forecastKind: toPrismaForecastKind(input.forecastKind),
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      include: forecastSnapshotInclude,
    });

    if (!forecast) {
      return null;
    }

    return toForecastSnapshot(forecast);
  }

  async findHistory(
    input: FindForecastHistoryInput,
  ): Promise<readonly ForecastHistoryItem[]> {
    const forecasts = await prisma.forecast.findMany({
      where: {
        ...(input.entityId
          ? {
              entityId: input.entityId,
            }
          : {}),

        ...(input.forecastType
          ? {
              forecastType: toPrismaForecastType(input.forecastType),
            }
          : {}),

        ...(input.forecastKind
          ? {
              forecastKind: toPrismaForecastKind(input.forecastKind),
            }
          : {}),

        ...(input.status
          ? {
              status: toPrismaForecastStatus(input.status),
            }
          : {}),
      },

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      include: forecastHistoryInclude,
    });

    return forecasts.map(toForecastHistoryItem);
  }
}
