import { createHash } from "node:crypto";

import type {
  RawIngestionPersistence,
  RawPersistenceResult,
} from "../ingestion/raw-ingestion.persistence.js";
import type { RawIngestionRecord } from "../ingestion/raw-ingestion.types.js";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "./client.js";

interface PreparedRawRecord {
  readonly sourceId: string;
  readonly sourceKey: string;
  readonly entityId: string;
  readonly checksum: string;
  readonly observedAt: Date;
  readonly payload: Prisma.InputJsonValue;
}

export class PrismaRawRecordRepository implements RawIngestionPersistence {
  async save(
    records: readonly RawIngestionRecord[],
  ): Promise<RawPersistenceResult> {
    if (records.length === 0) {
      return {
        receivedCount: 0,
        createdCount: 0,
        duplicateCount: 0,
        records: [],
      };
    }

    const preparedRecords = await this.prepareRecords(records);

    const result = await prisma.rawRecord.createMany({
      data: [...preparedRecords],
      skipDuplicates: true,
    });

    const persistedRecords = await prisma.rawRecord.findMany({
      where: {
        OR: preparedRecords.map((record) => ({
          sourceId: record.sourceId,
          checksum: record.checksum,
        })),
      },
      include: {
        source: {
          select: {
            key: true,
          },
        },
      },
    });

    return {
      receivedCount: records.length,
      createdCount: result.count,
      duplicateCount: records.length - result.count,

      records: persistedRecords.map((record) => {
        if (!record.entityId) {
          throw new Error(`RawRecord "${record.id}" has no entityId`);
        }

        return {
          id: record.id,
          sourceKey: record.source.key,
          entityId: record.entityId,
          payload: record.payload,
          recordedAt: record.observedAt,
        };
      }),
    };
  }

  private async prepareRecords(
    records: readonly RawIngestionRecord[],
  ): Promise<readonly PreparedRawRecord[]> {
    const sourceKeys = [...new Set(records.map((record) => record.source))];

    const entitySlugs = [...new Set(records.map((record) => record.entity))];

    const [sources, entities] = await Promise.all([
      prisma.source.findMany({
        where: {
          key: {
            in: sourceKeys,
          },
        },
        select: {
          id: true,
          key: true,
          isActive: true,
        },
      }),

      prisma.entity.findMany({
        where: {
          slug: {
            in: entitySlugs,
          },
        },
        select: {
          id: true,
          slug: true,
        },
      }),
    ]);

    const sourceByKey = new Map(sources.map((source) => [source.key, source]));

    const entityIdBySlug = new Map(
      entities.map((entity) => [entity.slug, entity.id]),
    );

    return records.map((record) => {
      const source = sourceByKey.get(record.source);

      if (!source) {
        throw new Error(`Source "${record.source}" was not found`);
      }

      if (!source.isActive) {
        throw new Error(`Source "${record.source}" is not active`);
      }

      const entityId = entityIdBySlug.get(record.entity);

      if (!entityId) {
        throw new Error(`Entity "${record.entity}" was not found`);
      }

      const observedAt = new Date(record.fetchedAt);

      if (Number.isNaN(observedAt.getTime())) {
        throw new Error(`Invalid fetchedAt for source "${record.source}"`);
      }

      const canonicalPayload = this.serializePayload(record.payload);

      return {
        sourceId: source.id,
        sourceKey: record.source,
        entityId,
        observedAt,
        checksum: this.createChecksum(record.entity, canonicalPayload),
        payload: JSON.parse(canonicalPayload) as Prisma.InputJsonValue,
      };
    });
  }

  private serializePayload(payload: unknown): string {
    if (payload === null || typeof payload !== "object") {
      throw new Error("Raw ingestion payload must be an object or array");
    }

    const normalized = this.sortJsonValue(payload);
    const serialized = JSON.stringify(normalized);

    if (!serialized) {
      throw new Error("Raw ingestion payload cannot be serialized");
    }

    return serialized;
  }

  private sortJsonValue(value: unknown): unknown {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new Error("Raw ingestion payload contains a non-finite number");
      }

      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sortJsonValue(item));
    }

    if (typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([, item]) => item !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, this.sortJsonValue(item)]),
      );
    }

    throw new Error(
      `Raw ingestion payload contains unsupported type "${typeof value}"`,
    );
  }

  private createChecksum(entity: string, canonicalPayload: string): string {
    return createHash("sha256")
      .update(entity)
      .update("\0")
      .update(canonicalPayload)
      .digest("hex");
  }
}
