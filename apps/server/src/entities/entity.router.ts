import { Router } from "express";

import type { EntityService } from "./entity.service.js";

import { createGetEntitiesController } from "./entity.controller.js";

export const createEntityRouter = (service: EntityService): Router => {
  const router = Router();

  router.get("/", createGetEntitiesController(service));

  return router;
};
