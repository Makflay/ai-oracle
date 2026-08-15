import type { ForecastEntity } from "@ai-oracle/shared";

import { prisma } from "../db/client.js";

export interface EntityRepository {
  findAll(): Promise<readonly ForecastEntity[]>;
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
}
