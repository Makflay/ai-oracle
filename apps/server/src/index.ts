import express from "express";

import { createApplicationDependencies } from "./bootstrap.js";

import { config } from "./config/index.js";

import { createEntityRouter } from "./entities/index.js";

import {
  createDeveloperInterestRouter,
  createForecastHistoryRouter,
  createProjectForecastRouter,
} from "./forecasts/index.js";

import { apiErrorHandler } from "./common/api-error.middleware.js";

const app = express();

const {
  entityService,
  currentForecastService,
  forecastHistoryService,
  refreshForecastService,
} = createApplicationDependencies();

app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "ai-oracle-server",
  });
});

app.use("/api/entities", createEntityRouter(entityService));

app.use(
  "/api/entities",
  createProjectForecastRouter({
    entityService,
    currentForecastService,
    refreshForecastService,
  }),
);

app.use(
  "/api/developer-interest",
  createDeveloperInterestRouter({
    entityService,
    currentForecastService,
    refreshForecastService,
  }),
);

app.use("/api/forecasts", createForecastHistoryRouter(forecastHistoryService));

app.use(apiErrorHandler);

app.listen(config.port, () => {
  console.log(`AI Oracle server started at http://localhost:${config.port}`);
});
