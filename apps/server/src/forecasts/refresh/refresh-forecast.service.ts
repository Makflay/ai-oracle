import { RawIngestionOrchestrator } from "../../ingestion/index.js";
import { MetricProcessingService } from "../../metrics/index.js";

import type { MetricSourceRecord } from "../../metrics/index.js";

import type {
  ForecastMetricInput,
  ForecastStrategyInput,
} from "../contracts/index.js";

import { ForecastPersistenceService } from "../persistence/index.js";
import { CurrentForecastService } from "../queries/index.js";

import type { ForecastStrategyRegistry } from "./forecast-strategy.registry.js";

import type {
  RefreshForecastInput,
  RefreshForecastResult,
} from "./refresh-forecast.types.js";

const FORECAST_HORIZON_DAYS = 14;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;

export class RefreshForecastService {
  constructor(
    private readonly ingestion: RawIngestionOrchestrator,
    private readonly metrics: MetricProcessingService,
    private readonly strategies: ForecastStrategyRegistry,
    private readonly forecastPersistence: ForecastPersistenceService,
    private readonly currentForecast: CurrentForecastService,
  ) {}

  async refreshForecast(
    input: RefreshForecastInput,
  ): Promise<RefreshForecastResult> {
    const entitySlug = input.entitySlug.trim();
    const strategyKey = input.strategyKey.trim();

    if (!entitySlug) {
      throw new Error("refreshForecast entitySlug is required");
    }

    if (!strategyKey) {
      throw new Error("refreshForecast strategyKey is required");
    }

    const strategy = this.strategies.get(strategyKey);

    if (!strategy) {
      throw new Error(`Forecast strategy "${strategyKey}" is not configured`);
    }

    const ingestionResult = await this.ingestion.ingest(
      entitySlug,
      input.ingestionOptions,
    );

    if (ingestionResult.persistence.records.length === 0) {
      throw new Error(`No raw records available for entity "${entitySlug}"`);
    }

    const entityIds = new Set(
      ingestionResult.persistence.records.map((record) => record.entityId),
    );

    if (entityIds.size !== 1) {
      throw new Error(`Ingestion returned records for multiple entities`);
    }

    const [entityId] = entityIds;

    if (!entityId) {
      throw new Error(`Entity "${entitySlug}" was not resolved`);
    }

    const metricSourceRecords: readonly MetricSourceRecord[] =
      ingestionResult.persistence.records.map((record) => ({
        rawRecordId: record.id,
        sourceKey: record.sourceKey,
        entityId: record.entityId,
        payload: record.payload,
        recordedAt: record.recordedAt,
      }));

    const metricResult = await this.metrics.process(metricSourceRecords);

    if (metricResult.records.length === 0) {
      throw new Error(`No metrics available for entity "${entitySlug}"`);
    }

    const asOf = new Date();
    const targetAt = new Date(
      asOf.getTime() + FORECAST_HORIZON_DAYS * MILLISECONDS_PER_DAY,
    );

    const forecastMetrics: readonly ForecastMetricInput[] =
      metricResult.records.map((metric) => ({
        metricId: metric.id,
        sourceKey: metric.sourceKey,
        type: metric.metricType,
        rawValue: metric.value,
        normalizedValue: metric.normalizedValue,
        recordedAt: metric.recordedAt.toISOString(),
      }));

    const strategyInput: ForecastStrategyInput = {
      entityId,
      forecastType: input.forecastType,
      asOf: asOf.toISOString(),
      targetAt: targetAt.toISOString(),
      metrics: forecastMetrics,
    };

    const forecastResult = await strategy.forecast(strategyInput);

    await this.forecastPersistence.save({
      entityId,
      forecastType: input.forecastType,
      targetAt: targetAt.toISOString(),
      result: forecastResult,
      createdAt: asOf,
    });

    const current = await this.currentForecast.getCurrent({
      entityId,
      forecastType: input.forecastType,
    });

    if (!current) {
      throw new Error(
        "Forecast was persisted but current forecast could not be loaded",
      );
    }

    return {
      forecast: current,
      ingestionFailures: ingestionResult.failures,
      createdRawRecordCount: ingestionResult.persistence.createdCount,
      duplicateRawRecordCount: ingestionResult.persistence.duplicateCount,
      createdMetricCount: metricResult.createdCount,
      duplicateMetricCount: metricResult.duplicateCount,
    };
  }
}
