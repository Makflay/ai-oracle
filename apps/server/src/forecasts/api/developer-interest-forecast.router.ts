import { Router } from "express";

import { DeveloperInterestController } from "./developer-interest-forecast.controller.js";

import type { DeveloperInterestControllerDependencies } from "./developer-interest-forecast.controller.js";

export const createDeveloperInterestRouter = (
  dependencies: DeveloperInterestControllerDependencies,
): Router => {
  const router = Router();

  const controller = new DeveloperInterestController(dependencies);

  router.get("/forecast", controller.getCurrent);

  router.post("/forecast/refresh", controller.refresh);

  return router;
};
