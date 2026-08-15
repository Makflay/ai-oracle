import {
  ForecastType as PrismaForecastType,
  Prisma,
  RiskLevel as PrismaRiskLevel,
  MetricType as PrismaMetricType,
  PredictionDirection as PrismaPredictionDirection,
} from "../generated/prisma/client.js";

import {
  ForecastType,
  RiskLevel,
  MetricType,
  PredictionDirection,
} from "@ai-oracle/shared";

import { prisma } from "./client.js";

import type {
  CreateForecastSnapshot,
  ForecastExplainabilityMetadata,
  ForecastPersistence,
  StoredForecastSnapshot,
  CurrentForecast,
  CurrentForecastRepository,
  FindCurrentForecastInput,
} from "../forecasts/index.ts";

const toPrismaForecastType = (type: ForecastType): PrismaForecastType => {
  switch (type) {
    case ForecastType.ShortTerm:
      return PrismaForecastType.SHORT_TERM;

    case ForecastType.MediumTerm:
      return PrismaForecastType.MEDIUM_TERM;

    case ForecastType.LongTerm:
      return PrismaForecastType.LONG_TERM;
  }
};

const toDomainForecastType = (type: PrismaForecastType): ForecastType => {
  switch (type) {
    case PrismaForecastType.SHORT_TERM:
      return ForecastType.ShortTerm;

    case PrismaForecastType.MEDIUM_TERM:
      return ForecastType.MediumTerm;

    case PrismaForecastType.LONG_TERM:
      return ForecastType.LongTerm;
  }
};

const toPrismaRiskLevel = (risk: RiskLevel): PrismaRiskLevel => {
  switch (risk) {
    case RiskLevel.Low:
      return PrismaRiskLevel.LOW;

    case RiskLevel.Medium:
      return PrismaRiskLevel.MEDIUM;

    case RiskLevel.High:
      return PrismaRiskLevel.HIGH;
  }
};

const toDomainRiskLevel = (risk: PrismaRiskLevel): RiskLevel => {
  switch (risk) {
    case PrismaRiskLevel.LOW:
      return RiskLevel.Low;

    case PrismaRiskLevel.MEDIUM:
      return RiskLevel.Medium;

    case PrismaRiskLevel.HIGH:
      return RiskLevel.High;
  }
};

const toPrismaMetricType = (type: MetricType): PrismaMetricType => {
  switch (type) {
    case MetricType.Price:
      return PrismaMetricType.PRICE;

    case MetricType.Volume:
      return PrismaMetricType.VOLUME;

    case MetricType.Volatility:
      return PrismaMetricType.VOLATILITY;

    case MetricType.Momentum:
      return PrismaMetricType.MOMENTUM;

    case MetricType.Sentiment:
      return PrismaMetricType.SENTIMENT;

    case MetricType.Downloads:
      return PrismaMetricType.DOWNLOADS;

    case MetricType.Likes:
      return PrismaMetricType.LIKES;

    case MetricType.Mentions:
      return PrismaMetricType.MENTIONS;

    case MetricType.Score:
      return PrismaMetricType.SCORE;

    case MetricType.Comments:
      return PrismaMetricType.COMMENTS;

    case MetricType.Engagement:
      return PrismaMetricType.ENGAGEMENT;

    case MetricType.Publications:
      return PrismaMetricType.PUBLICATIONS;
  }
};

const toDomainMetricType = (type: PrismaMetricType): MetricType => {
  switch (type) {
    case PrismaMetricType.PRICE:
      return MetricType.Price;

    case PrismaMetricType.VOLUME:
      return MetricType.Volume;

    case PrismaMetricType.VOLATILITY:
      return MetricType.Volatility;

    case PrismaMetricType.MOMENTUM:
      return MetricType.Momentum;

    case PrismaMetricType.SENTIMENT:
      return MetricType.Sentiment;

    case PrismaMetricType.DOWNLOADS:
      return MetricType.Downloads;

    case PrismaMetricType.LIKES:
      return MetricType.Likes;

    case PrismaMetricType.MENTIONS:
      return MetricType.Mentions;

    case PrismaMetricType.SCORE:
      return MetricType.Score;

    case PrismaMetricType.COMMENTS:
      return MetricType.Comments;

    case PrismaMetricType.ENGAGEMENT:
      return MetricType.Engagement;

    case PrismaMetricType.PUBLICATIONS:
      return MetricType.Publications;
  }
};

const toPrismaPredictionDirection = (
  direction: PredictionDirection,
): PrismaPredictionDirection => {
  switch (direction) {
    case PredictionDirection.Up:
      return PrismaPredictionDirection.UP;

    case PredictionDirection.Down:
      return PrismaPredictionDirection.DOWN;

    case PredictionDirection.Neutral:
      return PrismaPredictionDirection.NEUTRAL;
  }
};

const toDomainPredictionDirection = (
  direction: PrismaPredictionDirection,
): PredictionDirection => {
  switch (direction) {
    case PrismaPredictionDirection.UP:
      return PredictionDirection.Up;

    case PrismaPredictionDirection.DOWN:
      return PredictionDirection.Down;

    case PrismaPredictionDirection.NEUTRAL:
      return PredictionDirection.Neutral;
  }
};

export class PrismaForecastRepository
  implements ForecastPersistence, CurrentForecastRepository
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
    };
  }

  async findCurrent(
    input: FindCurrentForecastInput,
  ): Promise<CurrentForecast | null> {
    const forecast = await prisma.forecast.findFirst({
      where: {
        entityId: input.entityId,
        forecastType: toPrismaForecastType(input.forecastType),
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      include: {
        factors: {
          orderBy: {
            position: "asc",
          },
        },
        outcome: true,
      },
    });

    if (!forecast) {
      return null;
    }

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
            actualDirection: toDomainPredictionDirection(
              forecast.outcome.actualDirection,
            ),
            actualValue: forecast.outcome.actualValue?.toNumber() ?? null,
            accuracyScore: forecast.outcome.accuracyScore?.toNumber() ?? null,
            observedAt: forecast.outcome.observedAt,
            createdAt: forecast.outcome.createdAt,
          }
        : null,
    };
  }
}
