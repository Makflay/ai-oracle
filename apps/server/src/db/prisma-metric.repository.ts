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

    return {
      receivedCount: records.length,
      createdCount: result.count,
      duplicateCount: records.length - result.count,
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
}
