import type { ForecastEntity } from "@ai-oracle/shared";

import { prisma } from "../db/client.js";

export interface EntityRepository {
  findAll(): Promise<readonly ForecastEntity[]>;

  findById(id: string): Promise<ForecastEntity | null>;

  findBySlug(slug: string): Promise<ForecastEntity | null>;
}

export class PrismaEntityRepository implements EntityRepository {
  async findAll(): Promise<readonly ForecastEntity[]> {
    return prisma.entity.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        symbol: true,
        description: true,
      },
      orderBy: [
        {
          name: "asc",
        },
        {
          slug: "asc",
        },
      ],
    });
  }

  async findById(id: string): Promise<ForecastEntity | null> {
    return prisma.entity.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        symbol: true,
        description: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<ForecastEntity | null> {
    return prisma.entity.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        symbol: true,
        description: true,
      },
    });
  }
}
