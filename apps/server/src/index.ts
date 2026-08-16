import express from "express";

import { config } from "./config/index.js";

import {
  createEntityRouter,
  EntityService,
  PrismaEntityRepository,
} from "./entities/index.js";

import { createProjectForecastRouter } from "./forecasts/index.js";

import { createDeveloperInterestRouter } from "./forecasts/index.js";

import { createForecastHistoryRouter } from "./forecasts/index.js";

const app = express();

const entityRepository = new PrismaEntityRepository();
const entityService = new EntityService(entityRepository);

app.use(express.json());

app.use("/api/entities", createEntityRouter(entityService));

// app.use(
//   "/api/entities",
//   createProjectForecastRouter({
//     entityService,
//     currentForecastService,
//     refreshForecastService,
//   }),
// );

// app.use(
//   "/api/developer-interest",
//   createDeveloperInterestRouter({
//     entityService,
//     currentForecastService,
//     refreshForecastService,
//   }),
// );

//app.use("/api/forecasts", createForecastHistoryRouter(forecastHistoryService));

app.listen(config.port);
