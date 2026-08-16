import {
  ForecastStatus as PrismaForecastStatus,
  ForecastType as PrismaForecastType,
  RiskLevel as PrismaRiskLevel,
} from "../generated/prisma/client.js";

import { ForecastStatus, ForecastType, RiskLevel } from "@ai-oracle/shared";

import type {
  DueForecast,
  DueForecastRepository,
  FindDueForecastsInput,
} from "../evaluation/index.js";

import { prisma } from "./client.js";

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

const toDomainForecastStatus = (
  status: PrismaForecastStatus,
): ForecastStatus => {
  switch (status) {
    case PrismaForecastStatus.PENDING:
      return ForecastStatus.Pending;

    case PrismaForecastStatus.RUNNING:
      return ForecastStatus.Running;

    case PrismaForecastStatus.COMPLETED:
      return ForecastStatus.Completed;

    case PrismaForecastStatus.FAILED:
      return ForecastStatus.Failed;
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

export class PrismaDueForecastRepository implements DueForecastRepository {
  async findDue(input: FindDueForecastsInput): Promise<readonly DueForecast[]> {
    const forecasts = await prisma.forecast.findMany({
      where: {
        targetAt: {
          lte: input.dueAt,
        },
        outcome: {
          is: null,
        },
      },
      orderBy: [
        {
          targetAt: "asc",
        },
        {
          createdAt: "asc",
        },
        {
          id: "asc",
        },
      ],
      select: {
        id: true,
        entityId: true,
        forecastType: true,
        status: true,
        score: true,
        confidence: true,
        risk: true,
        prediction: true,
        predictedValue: true,
        targetAt: true,
        createdAt: true,
      },
    });

    return forecasts.map((forecast) => ({
      id: forecast.id,
      entityId: forecast.entityId,
      forecastType: toDomainForecastType(forecast.forecastType),
      status: toDomainForecastStatus(forecast.status),
      score: forecast.score.toNumber(),
      confidence: forecast.confidence?.toNumber() ?? null,
      risk: toDomainRiskLevel(forecast.risk),
      prediction: forecast.prediction,
      predictedValue: forecast.predictedValue?.toNumber() ?? null,
      targetAt: forecast.targetAt,
      createdAt: forecast.createdAt,
    }));
  }
}
