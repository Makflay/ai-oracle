import type { ForecastEntity } from "@ai-oracle/shared";

import type { EntityRepository } from "./entity.repository.js";

export class EntityService {
  constructor(private readonly repository: EntityRepository) {}

  async getEntities(): Promise<readonly ForecastEntity[]> {
    return this.repository.findAll();
  }

  async getEntityById(id: string): Promise<ForecastEntity | null> {
    return this.repository.findById(id);
  }

  async getEntityBySlug(slug: string): Promise<ForecastEntity | null> {
    return this.repository.findBySlug(slug);
  }
}
