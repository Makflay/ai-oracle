import { ApiStatus } from "@ai-oracle/shared";

import type { ApiSuccessResponse, ForecastEntity } from "@ai-oracle/shared";

import type { RequestHandler } from "express";

import type { EntityService } from "./entity.service.js";

export const createGetEntitiesController = (
  service: EntityService,
): RequestHandler => {
  return async (_request, response, next) => {
    try {
      const entities = await service.getEntities();

      const body: ApiSuccessResponse<readonly ForecastEntity[]> = {
        status: ApiStatus.Success,
        data: entities,
      };

      response.status(200).json(body);
    } catch (error: unknown) {
      next(error);
    }
  };
};
