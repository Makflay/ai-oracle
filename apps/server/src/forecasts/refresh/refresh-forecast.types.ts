import type { ForecastType } from "@ai-oracle/shared";

import type {
  RawIngestionFailure,
  RawIngestionOptions,
} from "../../ingestion/index.js";

import type { ForecastSnapshot } from "../queries/index.js";

export interface RefreshForecastInput {
  entitySlug: string;
  forecastType: ForecastType;
  strategyKey: string;
  ingestionOptions?: RawIngestionOptions;
}

export interface RefreshForecastResult {
  forecast: ForecastSnapshot;
  ingestionFailures: readonly RawIngestionFailure[];
  createdRawRecordCount: number;
  duplicateRawRecordCount: number;
  createdMetricCount: number;
  duplicateMetricCount: number;
}
