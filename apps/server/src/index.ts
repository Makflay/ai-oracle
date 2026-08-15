import express from "express";

import { config } from "./config/index.js";

import {
  createEntityRouter,
  EntityService,
  PrismaEntityRepository,
} from "./entities/index.js";

const app = express();

const entityRepository = new PrismaEntityRepository();
const entityService = new EntityService(entityRepository);

app.use(express.json());

app.use("/api/entities", createEntityRouter(entityService));

app.listen(config.port);
