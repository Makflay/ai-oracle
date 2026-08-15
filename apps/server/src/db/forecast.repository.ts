import {
  ForecastType as PrismaForecastType,
  Prisma,
  RiskLevel as PrismaRiskLevel,
} from "../generated/prisma/client.js";

import { ForecastType, RiskLevel } from "@ai-oracle/shared";

import { prisma } from "./client.js";

import type {
  CreateForecastSnapshot,
  ForecastExplainabilityMetadata,
  ForecastPersistence,
  StoredForecastSnapshot,
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

export class PrismaForecastRepository implements ForecastPersistence {
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
    };
  }
}
