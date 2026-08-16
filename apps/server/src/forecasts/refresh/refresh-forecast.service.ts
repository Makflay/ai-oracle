import { RawIngestionOrchestrator } from "../../ingestion/index.js";
import { MetricProcessingService } from "../../metrics/index.js";

import type {
  MetricSourceRecord,
  MetricHistoryRepository,
} from "../../metrics/index.js";

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

import { FORECAST_REFRESH_COOLDOWN_MS } from "./refresh-forecast.constants.js";

import type { ForecastEntityRepository } from "./forecast-entity.repository.js";

import { HISTORICAL_LOOKBACK_DAYS } from "../calculations/index.js";

const DAY_MS = 24 * 60 * 60 * 1_000;

export class RefreshForecastService {
  constructor(
    private readonly entities: ForecastEntityRepository,
    private readonly ingestion: RawIngestionOrchestrator,
    private readonly metrics: MetricProcessingService,
    private readonly metricHistory: MetricHistoryRepository,
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

    const entity = await this.entities.findBySlug(entitySlug);

    if (!entity) {
      throw new Error(`Entity "${entitySlug}" was not found`);
    }

    const executionKey = [entity.id, input.forecastType].join(":");

    const inFlight = this.inFlightByForecast.get(executionKey);

    if (inFlight) {
      return inFlight;
    }

    const execution = this.executeRefresh(input, entity.id, entity.slug);

    this.inFlightByForecast.set(executionKey, execution);

    try {
      return await execution;
    } finally {
      if (this.inFlightByForecast.get(executionKey) === execution) {
        this.inFlightByForecast.delete(executionKey);
      }
    }
  }

  private readonly inFlightByForecast = new Map<
    string,
    Promise<RefreshForecastResult>
  >();

  private async executeRefresh(
    input: RefreshForecastInput,
    entityId: string,
    entitySlug: string,
  ): Promise<RefreshForecastResult> {
    const current = await this.currentForecast.getCurrent({
      entityId,
      forecastType: input.forecastType,
    });

    const checkedAt = new Date();

    if (
      current &&
      checkedAt.getTime() <
        current.createdAt.getTime() + FORECAST_REFRESH_COOLDOWN_MS
    ) {
      return {
        forecast: current,
        refreshed: false,
        ingestionFailures: [],
        createdRawRecordCount: 0,
        duplicateRawRecordCount: 0,
        createdMetricCount: 0,
        duplicateMetricCount: 0,
      };
    }

    const strategy = this.strategies.get(input.strategyKey);

    if (!strategy) {
      throw new Error(
        `Forecast strategy "${input.strategyKey}" is not configured`,
      );
    }

    const ingestionResult = await this.ingestion.ingest(
      entitySlug,
      input.ingestionOptions,
    );

    if (ingestionResult.persistence.records.length === 0) {
      throw new Error(`No raw records available for entity "${entitySlug}"`);
    }

    const containsUnexpectedEntity = ingestionResult.persistence.records.some(
      (record) => record.entityId !== entityId,
    );

    if (containsUnexpectedEntity) {
      throw new Error("Ingestion returned records for an unexpected entity");
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

    const historicalMetrics = await this.metricHistory.findHistory({
      entityId,
      observedFrom: new Date(
        asOf.getTime() - HISTORICAL_LOOKBACK_DAYS * DAY_MS,
      ),
      observedTo: asOf,
    });

    const targetAt = new Date(asOf.getTime() + 14 * 24 * 60 * 60 * 1_000);

    const forecastMetrics: readonly ForecastMetricInput[] =
      historicalMetrics.map((metric) => ({
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
      targetAt: strategyInput.targetAt,
      result: forecastResult,
      createdAt: asOf,
    });

    const refreshedForecast = await this.currentForecast.getCurrent({
      entityId,
      forecastType: input.forecastType,
    });

    if (!refreshedForecast) {
      throw new Error(
        "Forecast was persisted but current forecast could not be loaded",
      );
    }

    return {
      forecast: refreshedForecast,
      refreshed: true,
      ingestionFailures: ingestionResult.failures,
      createdRawRecordCount: ingestionResult.persistence.createdCount,
      duplicateRawRecordCount: ingestionResult.persistence.duplicateCount,
      createdMetricCount: metricResult.createdCount,
      duplicateMetricCount: metricResult.duplicateCount,
    };
  }
}
