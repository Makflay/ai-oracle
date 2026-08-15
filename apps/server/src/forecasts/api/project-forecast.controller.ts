import {
  ApiStatus,
  ForecastType,
  ProjectForecastApiErrorCode,
} from "@ai-oracle/shared";

import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  ProjectForecastApiErrorCode as ProjectForecastErrorCode,
  ProjectForecastDto,
  ProjectForecastRefreshDto,
} from "@ai-oracle/shared";

import type { Request, Response } from "express";

import { z } from "zod";

import type { EntityService } from "../../entities/index.js";

import type { CurrentForecastService } from "../queries/index.js";

import type { RefreshForecastService } from "../refresh/index.js";

import { toProjectForecastDto } from "./project-forecast.mapper.js";

const entityIdSchema = z.uuid();

const SYSTEM_ENTITY_SLUG = "ai-developer-interest";

type ErrorResponse = ApiErrorResponse<ProjectForecastErrorCode>;

export interface ProjectForecastControllerDependencies {
  entityService: EntityService;
  currentForecastService: CurrentForecastService;
  refreshForecastService: RefreshForecastService;
}

const sendError = (
  response: Response<ErrorResponse>,
  status: number,
  code: ProjectForecastErrorCode,
  message: string,
): void => {
  response.status(status).json({
    status: ApiStatus.Error,
    error: {
      code,
      message,
    },
  });
};

export class ProjectForecastController {
  constructor(
    private readonly dependencies: ProjectForecastControllerDependencies,
  ) {}

  getCurrent = async (
    request: Request<{ id: string }>,
    response: Response<ApiSuccessResponse<ProjectForecastDto> | ErrorResponse>,
  ): Promise<void> => {
    const entityId = entityIdSchema.safeParse(request.params.id);

    if (!entityId.success) {
      sendError(
        response,
        400,
        ProjectForecastApiErrorCode.InvalidEntityId,
        "Entity id must be a valid UUID",
      );

      return;
    }

    try {
      const entity = await this.dependencies.entityService.getEntityById(
        entityId.data,
      );

      if (!entity) {
        sendError(
          response,
          404,
          ProjectForecastApiErrorCode.EntityNotFound,
          "Entity was not found",
        );

        return;
      }

      if (entity.slug === SYSTEM_ENTITY_SLUG) {
        sendError(
          response,
          400,
          ProjectForecastApiErrorCode.EntityIsNotProject,
          "Entity does not represent an AI project",
        );

        return;
      }

      const forecast =
        await this.dependencies.currentForecastService.getCurrent({
          entityId: entity.id,
          forecastType: ForecastType.ShortTerm,
        });

      if (!forecast) {
        sendError(
          response,
          404,
          ProjectForecastApiErrorCode.ForecastNotFound,
          "Project forecast was not found",
        );

        return;
      }

      response.status(200).json({
        status: ApiStatus.Success,
        data: toProjectForecastDto(forecast),
      });
    } catch {
      sendError(
        response,
        500,
        ProjectForecastApiErrorCode.InternalError,
        "Unable to load project forecast",
      );
    }
  };

  refresh = async (
    request: Request<{ id: string }>,
    response: Response<
      ApiSuccessResponse<ProjectForecastRefreshDto> | ErrorResponse
    >,
  ): Promise<void> => {
    const entityId = entityIdSchema.safeParse(request.params.id);

    if (!entityId.success) {
      sendError(
        response,
        400,
        ProjectForecastApiErrorCode.InvalidEntityId,
        "Entity id must be a valid UUID",
      );

      return;
    }

    try {
      const entity = await this.dependencies.entityService.getEntityById(
        entityId.data,
      );

      if (!entity) {
        sendError(
          response,
          404,
          ProjectForecastApiErrorCode.EntityNotFound,
          "Entity was not found",
        );

        return;
      }

      if (entity.slug === SYSTEM_ENTITY_SLUG) {
        sendError(
          response,
          400,
          ProjectForecastApiErrorCode.EntityIsNotProject,
          "Entity does not represent an AI project",
        );

        return;
      }

      const result =
        await this.dependencies.refreshForecastService.refreshForecast({
          entitySlug: entity.slug,
          forecastType: ForecastType.ShortTerm,
          strategyKey: "project_popularity",
        });

      response.status(200).json({
        status: ApiStatus.Success,
        data: {
          forecast: toProjectForecastDto(result.forecast),
          refreshed: result.refreshed,
        },
      });
    } catch {
      sendError(
        response,
        502,
        ProjectForecastApiErrorCode.RefreshFailed,
        "Unable to refresh project forecast",
      );
    }
  };
}
