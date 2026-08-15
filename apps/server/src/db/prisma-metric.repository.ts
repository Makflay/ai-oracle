import { MetricType as DomainMetricType } from "@ai-oracle/shared";

import { MetricType as PrismaMetricType } from "../generated/prisma/client.js";
import type {
  MetricPersistence,
  MetricPersistenceRecord,
  MetricPersistenceResult,
} from "../metrics/persistence/index.js";
import { prisma } from "./client.js";

export class PrismaMetricRepository implements MetricPersistence {
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
        type: this.toPrismaMetricType(record.metricType),
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
          type: this.toPrismaMetricType(record.metricType),
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
          metricType: this.toDomainMetricType(metric.type),
          value: metric.value.toNumber(),
          normalizedValue: metric.normalizedValue.toNumber(),
          recordedAt: metric.observedAt,
        };
      }),
    };
  }

  private toPrismaMetricType(metricType: DomainMetricType): PrismaMetricType {
    switch (metricType) {
      case DomainMetricType.Downloads:
        return PrismaMetricType.DOWNLOADS;

      case DomainMetricType.Likes:
        return PrismaMetricType.LIKES;

      case DomainMetricType.Mentions:
        return PrismaMetricType.MENTIONS;

      case DomainMetricType.Score:
        return PrismaMetricType.SCORE;

      case DomainMetricType.Comments:
        return PrismaMetricType.COMMENTS;

      case DomainMetricType.Engagement:
        return PrismaMetricType.ENGAGEMENT;

      case DomainMetricType.Publications:
        return PrismaMetricType.PUBLICATIONS;

      default:
        throw new Error(`Unsupported metric type "${metricType}"`);
    }
  }

  private toDomainMetricType(metricType: PrismaMetricType): DomainMetricType {
    switch (metricType) {
      case PrismaMetricType.DOWNLOADS:
        return DomainMetricType.Downloads;

      case PrismaMetricType.LIKES:
        return DomainMetricType.Likes;

      case PrismaMetricType.MENTIONS:
        return DomainMetricType.Mentions;

      case PrismaMetricType.SCORE:
        return DomainMetricType.Score;

      case PrismaMetricType.COMMENTS:
        return DomainMetricType.Comments;

      case PrismaMetricType.ENGAGEMENT:
        return DomainMetricType.Engagement;

      case PrismaMetricType.PUBLICATIONS:
        return DomainMetricType.Publications;

      default:
        throw new Error(`Unsupported Prisma metric type "${metricType}"`);
    }
  }
}
