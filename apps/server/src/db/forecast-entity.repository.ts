import type {
  ForecastEntityReference,
  ForecastEntityRepository,
} from "../forecasts/refresh/forecast-entity.repository.js";

import { prisma } from "./client.js";

export class PrismaForecastEntityRepository implements ForecastEntityRepository {
  async findBySlug(slug: string): Promise<ForecastEntityReference | null> {
    return prisma.entity.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        slug: true,
      },
    });
  }
}
