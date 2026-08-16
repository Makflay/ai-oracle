import {
  ApiStatus,
  ForecastHistoryApiErrorCode,
  ForecastStatus,
  ForecastType,
  ForecastKind,
} from "@ai-oracle/shared";

import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  ForecastHistoryApiErrorCode as HistoryErrorCode,
  ForecastHistoryItemDto,
} from "@ai-oracle/shared";

import type { RequestHandler, Response, NextFunction } from "express";

import { z } from "zod";

import type { ForecastHistoryService } from "../queries/index.js";

import { toForecastHistoryItemDto } from "./forecast-history.mapper.js";

const historyQuerySchema = z.object({
  entityId: z.uuid().optional(),
  forecastType: z.enum(ForecastType).optional(),
  status: z.enum(ForecastStatus).optional(),
  forecastKind: z.enum(ForecastKind).optional(),
});

type HistoryErrorResponse = ApiErrorResponse<HistoryErrorCode>;

export const createForecastHistoryController = (
  service: ForecastHistoryService,
): RequestHandler => {
  return async (
    request,
    response: Response<
      | ApiSuccessResponse<readonly ForecastHistoryItemDto[]>
      | HistoryErrorResponse
    >,
    next: NextFunction,
  ): Promise<void> => {
    const query = historyQuerySchema.safeParse(request.query);

    if (!query.success) {
      response.status(400).json({
        status: ApiStatus.Error,
        error: {
          code: ForecastHistoryApiErrorCode.InvalidFilters,
          message: "Forecast history filters are invalid",
        },
      });

      return;
    }

    try {
      const history = await service.getHistory(query.data);

      response.status(200).json({
        status: ApiStatus.Success,
        data: history.map(toForecastHistoryItemDto),
      });
    } catch (error: unknown) {
      next(error);
    }
  };
};
