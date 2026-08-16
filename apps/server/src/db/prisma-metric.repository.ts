import { MetricType as PrismaMetricType } from "../generated/prisma/client.js";
import { prisma } from "./client.js";
import { MetricType as DomainMetricType } from "@ai-oracle/shared";
import type {
  MetricPersistence,
  MetricPersistenceRecord,
  MetricPersistenceResult,
  FindMetricHistoryInput,
  MetricHistoryRepository,
  PersistedMetricRecord,
} from "../metrics/persistence/index.js";

import { toDomainMetricType, toPrismaMetricType } from "./mappers/index.js";

const SUPPORTED_DOMAIN_METRIC_TYPES: ReadonlySet<DomainMetricType> = new Set([
  DomainMetricType.Downloads,
  DomainMetricType.Likes,
  DomainMetricType.Mentions,
  DomainMetricType.Score,
  DomainMetricType.Comments,
  DomainMetricType.Engagement,
  DomainMetricType.Publications,
]);

const SUPPORTED_PRISMA_METRIC_TYPES: ReadonlySet<PrismaMetricType> = new Set([
  PrismaMetricType.DOWNLOADS,
  PrismaMetricType.LIKES,
  PrismaMetricType.MENTIONS,
  PrismaMetricType.SCORE,
  PrismaMetricType.COMMENTS,
  PrismaMetricType.ENGAGEMENT,
  PrismaMetricType.PUBLICATIONS,
]);

export class PrismaMetricRepository
  implements MetricPersistence, MetricHistoryRepository
{
  async save(
    records: readonly MetricPersistenceRecord[],
  ): Promise<MetricPersistenceResult> {
    if (records.length === 0) {
      return {
        receivedCount: 0,
        createdCount: 0,
        duplicateCount: 0,
        records: [],
      };
    }

    const result = await prisma.metric.createMany({
      data: records.map((record) => ({
        rawRecordId: record.rawRecordId,
        entityId: record.entityId,
        type: this.toPersistedPrismaMetricType(record.metricType),
        value: record.value,
        normalizedValue: record.normalizedValue,
        observedAt: record.recordedAt,
      })),
      skipDuplicates: true,
    });

    const persistedMetrics = await prisma.metric.findMany({
      where: {
        OR: records.map((record) => ({
          rawRecordId: record.rawRecordId,
          type: this.toPersistedPrismaMetricType(record.metricType),
        })),
      },
      include: {
        rawRecord: {
          include: {
            source: {
              select: {
                key: true,
              },
            },
          },
        },
      },
    });

    return {
      receivedCount: records.length,
      createdCount: result.count,
      duplicateCount: records.length - result.count,
      records: persistedMetrics.map((metric) => {
        if (!metric.rawRecordId || !metric.rawRecord) {
          throw new Error(`Metric "${metric.id}" has no RawRecord`);
        }

        return {
          id: metric.id,
          rawRecordId: metric.rawRecordId,
          entityId: metric.entityId,
          sourceKey: metric.rawRecord.source.key,
          metricType: this.toPersistedDomainMetricType(metric.type),
          value: metric.value.toNumber(),
          normalizedValue: metric.normalizedValue.toNumber(),
          recordedAt: metric.observedAt,
        };
      }),
    };
  }

  async findHistory(
    input: FindMetricHistoryInput,
  ): Promise<readonly PersistedMetricRecord[]> {
    if (
      Number.isNaN(input.observedFrom.getTime()) ||
      Number.isNaN(input.observedTo.getTime())
    ) {
      throw new Error("Metric history requires valid date boundaries");
    }

    if (input.observedFrom > input.observedTo) {
      throw new Error("Metric history observedFrom cannot be after observedTo");
    }

    const metrics = await prisma.metric.findMany({
      where: {
        entityId: input.entityId,
        observedAt: {
          gte: input.observedFrom,
          lte: input.observedTo,
        },
        rawRecordId: {
          not: null,
        },
      },
      include: {
        rawRecord: {
          include: {
            source: {
              select: {
                key: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          observedAt: "desc",
        },
        {
          id: "desc",
        },
      ],
    });

    return metrics.map((metric) => {
      if (!metric.rawRecordId || !metric.rawRecord) {
        throw new Error(`Metric "${metric.id}" has no RawRecord`);
      }

      return {
        id: metric.id,
        rawRecordId: metric.rawRecordId,
        entityId: metric.entityId,
        sourceKey: metric.rawRecord.source.key,
        metricType: this.toPersistedDomainMetricType(metric.type),
        value: metric.value.toNumber(),
        normalizedValue: metric.normalizedValue.toNumber(),
        recordedAt: metric.observedAt,
      };
    });
  }

  private toPersistedPrismaMetricType(
    metricType: DomainMetricType,
  ): PrismaMetricType {
    if (!SUPPORTED_DOMAIN_METRIC_TYPES.has(metricType)) {
      throw new Error(`Unsupported metric type "${metricType}"`);
    }

    return toPrismaMetricType(metricType);
  }

  private toPersistedDomainMetricType(
    metricType: PrismaMetricType,
  ): DomainMetricType {
    if (!SUPPORTED_PRISMA_METRIC_TYPES.has(metricType)) {
      throw new Error(`Unsupported Prisma metric type "${metricType}"`);
    }

    return toDomainMetricType(metricType);
  }
}
