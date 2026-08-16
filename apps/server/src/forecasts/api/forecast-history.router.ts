import { Router } from "express";

import type { ForecastHistoryService } from "../queries/index.js";

import { createForecastHistoryController } from "./forecast-history.controller.js";

export const createForecastHistoryRouter = (
  service: ForecastHistoryService,
): Router => {
  const router = Router();

  router.get("/history", createForecastHistoryController(service));

  return router;
};
