import { ForecastStatus as PrismaForecastStatus } from "../generated/prisma/client.js";

import type {
  DueForecast,
  DueForecastRepository,
  FindDueForecastsInput,
} from "../evaluation/index.js";

import { prisma } from "./client.js";

import {
  toDomainForecastKind,
  toDomainForecastStatus,
  toDomainForecastType,
  toDomainMetricType,
  toDomainRiskLevel,
} from "./mappers/index.js";

export class PrismaDueForecastRepository implements DueForecastRepository {
  async findDue(input: FindDueForecastsInput): Promise<readonly DueForecast[]> {
    const forecasts = await prisma.forecast.findMany({
      where: {
        status: PrismaForecastStatus.COMPLETED,
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
        forecastKind: true,

        entity: {
          select: {
            slug: true,
          },
        },
        factors: {
          select: {
            id: true,
            metricId: true,
            sourceKey: true,
            metricType: true,
            position: true,
            normalizedValue: true,
            weight: true,
            contribution: true,
          },
          orderBy: {
            position: "asc",
          },
        },
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

      entitySlug: forecast.entity.slug,

      factors: forecast.factors.map((factor) => ({
        id: factor.id,
        metricId: factor.metricId,
        sourceKey: factor.sourceKey,
        metricType: toDomainMetricType(factor.metricType),
        position: factor.position,
        normalizedValue: factor.normalizedValue.toNumber(),
        weight: factor.weight.toNumber(),
        contribution: factor.contribution.toNumber(),
      })),
      forecastKind: toDomainForecastKind(forecast.forecastKind),
    }));
  }
}
