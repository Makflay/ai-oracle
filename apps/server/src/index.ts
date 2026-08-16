import express from "express";

import { createApplicationDependencies } from "./bootstrap.js";

import { config } from "./config/index.js";

import { createEntityRouter } from "./entities/index.js";

import {
  createDeveloperInterestRouter,
  createForecastHistoryRouter,
  createProjectForecastRouter,
} from "./forecasts/index.js";

const app = express();

const {
  entityService,
  currentForecastService,
  forecastHistoryService,
  refreshForecastService,
} = createApplicationDependencies();

app.use(express.json());

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

app.listen(config.port);
