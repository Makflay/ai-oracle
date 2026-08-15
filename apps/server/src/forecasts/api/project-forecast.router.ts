import { Router } from "express";

import { ProjectForecastController } from "./project-forecast.controller.js";

import type { ProjectForecastControllerDependencies } from "./project-forecast.controller.js";

export const createProjectForecastRouter = (
  dependencies: ProjectForecastControllerDependencies,
): Router => {
  const router = Router();

  const controller = new ProjectForecastController(dependencies);

  router.get("/:id/forecast", controller.getCurrent);

  router.post("/:id/forecast/refresh", controller.refresh);

  return router;
};
