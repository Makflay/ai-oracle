import {
  ApiStatus,
  DeveloperInterestApiErrorCode,
  ForecastType,
  ForecastKind,
} from "@ai-oracle/shared";

import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  DeveloperInterestApiErrorCode as DeveloperInterestErrorCode,
  DeveloperInterestForecastDto,
  DeveloperInterestRefreshDto,
} from "@ai-oracle/shared";

import type { RequestHandler, Response, Request, NextFunction } from "express";

import type { EntityService } from "../../entities/index.js";

import type { CurrentForecastService } from "../queries/index.js";

import type { RefreshForecastService } from "../refresh/index.js";

import { toDeveloperInterestForecastDto } from "./developer-interest-forecast.mapper.js";

import { ForecastUpstreamUnavailableError } from "../refresh/index.js";

const DEVELOPER_INTEREST_ENTITY_SLUG = "ai-developer-interest";

const DEVELOPER_INTEREST_STRATEGY_KEY = "developer_interest";

type ErrorResponse = ApiErrorResponse<DeveloperInterestErrorCode>;

export interface DeveloperInterestControllerDependencies {
  entityService: EntityService;
  currentForecastService: CurrentForecastService;
  refreshForecastService: RefreshForecastService;
}

const sendError = (
  response: Response<ErrorResponse>,
  status: number,
  code: DeveloperInterestErrorCode,
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

export class DeveloperInterestController {
  constructor(
    private readonly dependencies: DeveloperInterestControllerDependencies,
  ) {}

  getCurrent: RequestHandler = async (
    _request: Request,
    response: Response<
      ApiSuccessResponse<DeveloperInterestForecastDto> | ErrorResponse
    >,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const entity = await this.dependencies.entityService.getEntityBySlug(
        DEVELOPER_INTEREST_ENTITY_SLUG,
      );

      if (!entity) {
        sendError(
          response,
          404,
          DeveloperInterestApiErrorCode.EntityNotFound,
          "AI Developer Interest entity was not found",
        );

        return;
      }

      const forecast =
        await this.dependencies.currentForecastService.getCurrent({
          entityId: entity.id,
          forecastType: ForecastType.ShortTerm,
          forecastKind: ForecastKind.DeveloperInterest,
        });

      if (!forecast) {
        sendError(
          response,
          404,
          DeveloperInterestApiErrorCode.ForecastNotFound,
          "Developer interest forecast was not found",
        );

        return;
      }

      response.status(200).json({
        status: ApiStatus.Success,
        data: toDeveloperInterestForecastDto(forecast),
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  refresh: RequestHandler = async (
    _request,
    response: Response<
      ApiSuccessResponse<DeveloperInterestRefreshDto> | ErrorResponse
    >,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const entity = await this.dependencies.entityService.getEntityBySlug(
        DEVELOPER_INTEREST_ENTITY_SLUG,
      );

      if (!entity) {
        sendError(
          response,
          404,
          DeveloperInterestApiErrorCode.EntityNotFound,
          "AI Developer Interest entity was not found",
        );

        return;
      }

      const result =
        await this.dependencies.refreshForecastService.refreshForecast({
          entitySlug: entity.slug,
          forecastType: ForecastType.ShortTerm,
          strategyKey: DEVELOPER_INTEREST_STRATEGY_KEY,
          forecastKind: ForecastKind.DeveloperInterest,
        });

      response.status(200).json({
        status: ApiStatus.Success,
        data: {
          forecast: toDeveloperInterestForecastDto(result.forecast),
          refreshed: result.refreshed,
        },
      });
    } catch (error: unknown) {
      if (error instanceof ForecastUpstreamUnavailableError) {
        console.error(
          "Developer interest refresh failed because upstream sources are unavailable",
          error,
        );

        sendError(
          response,
          502,
          DeveloperInterestApiErrorCode.RefreshFailed,
          "Unable to refresh developer interest forecast",
        );

        return;
      }
      next(error);
    }
  };
}
