import type { DataSource } from "./sources/index.js";

import {
  ArxivDataSource,
  HackerNewsDataSource,
  HuggingFaceDataSource,
} from "./sources/index.js";

import type { EntitySourceRegistry } from "./ingestion/index.js";

import {
  RawIngestionOrchestrator,
  RawIngestionService,
} from "./ingestion/index.js";

import {
  ArxivMetricExtractor,
  HackerNewsMetricExtractor,
  HuggingFaceMetricExtractor,
  MetricProcessingService,
} from "./metrics/index.js";

import {
  CurrentForecastService,
  DeveloperInterestStrategy,
  ForecastHistoryService,
  ForecastPersistenceService,
  ProjectPopularityStrategy,
  RefreshForecastService,
  createForecastStrategyRegistry,
} from "./forecasts/index.js";

import { ActualMetricsService } from "./evaluation/actual-metrics.service.js";
import { DueForecastService } from "./evaluation/due-forecast.service.js";
import { ForecastEvaluationService } from "./evaluation/forecast-evaluation.service.js";
import { ForecastOutcomeService } from "./evaluation/forecast-outcome.service.js";

import { EntityService, PrismaEntityRepository } from "./entities/index.js";

import {
  PrismaForecastEntityRepository,
  PrismaForecastRepository,
  PrismaMetricRepository,
  PrismaRawRecordRepository,
  PrismaDueForecastRepository,
  PrismaForecastOutcomeRepository,
} from "./db/index.js";

interface ProjectSourceConfig {
  readonly slug: string;
  readonly modelId: string;
  readonly keywords: readonly string[];
}

const DEVELOPER_INTEREST_ENTITY_SLUG = "ai-developer-interest";

const PROJECT_SOURCE_CONFIGS: readonly ProjectSourceConfig[] = [
  {
    slug: "qwen",
    modelId: "Qwen/Qwen2.5-7B-Instruct",
    keywords: ["qwen", "alibaba qwen"],
  },
  {
    slug: "deepseek",
    modelId: "deepseek-ai/DeepSeek-R1",
    keywords: ["deepseek", "deepseek r1"],
  },
  {
    slug: "mistral",
    modelId: "mistralai/Mistral-7B-Instruct-v0.3",
    keywords: ["mistral ai", "mistral 7b"],
  },
  {
    slug: "gemma",
    modelId: "google/gemma-3-4b-it",
    keywords: ["gemma", "google gemma"],
  },
] as const;

const GLOBAL_AI_KEYWORDS = [
  "artificial intelligence",
  "generative ai",
  "large language model",
  "machine learning",
  "llm",
] as const;

const createProjectSources = (
  config: ProjectSourceConfig,
): readonly DataSource<unknown>[] => [
  new HuggingFaceDataSource({
    entitySlug: config.slug,
    modelId: config.modelId,
  }),

  new HackerNewsDataSource({
    entitySlug: config.slug,
    keywords: config.keywords,
    feed: "newstories",
  }),

  new ArxivDataSource({
    entitySlug: config.slug,
    keywords: config.keywords,
  }),
];

const createDeveloperInterestSources = (): readonly DataSource<unknown>[] => [
  ...PROJECT_SOURCE_CONFIGS.map(
    (project) =>
      new HuggingFaceDataSource({
        entitySlug: DEVELOPER_INTEREST_ENTITY_SLUG,
        modelId: project.modelId,
      }),
  ),

  new HackerNewsDataSource({
    entitySlug: DEVELOPER_INTEREST_ENTITY_SLUG,
    keywords: GLOBAL_AI_KEYWORDS,
    feed: "newstories",
  }),

  new ArxivDataSource({
    entitySlug: DEVELOPER_INTEREST_ENTITY_SLUG,
    keywords: GLOBAL_AI_KEYWORDS,
  }),
];

const createEntitySourceRegistry = (): EntitySourceRegistry => {
  const registry: Record<string, readonly DataSource<unknown>[]> = {};

  for (const project of PROJECT_SOURCE_CONFIGS) {
    registry[project.slug] = createProjectSources(project);
  }

  registry[DEVELOPER_INTEREST_ENTITY_SLUG] = createDeveloperInterestSources();

  return registry;
};

export interface ApplicationDependencies {
  readonly entityService: EntityService;
  readonly currentForecastService: CurrentForecastService;
  readonly forecastHistoryService: ForecastHistoryService;
  readonly refreshForecastService: RefreshForecastService;
  readonly forecastEvaluationService: ForecastEvaluationService;
}

export const createApplicationDependencies = (): ApplicationDependencies => {
  const entityRepository = new PrismaEntityRepository();

  const entityService = new EntityService(entityRepository);

  const rawRecordRepository = new PrismaRawRecordRepository();

  const rawIngestionService = new RawIngestionService(
    createEntitySourceRegistry(),
  );

  const rawIngestionOrchestrator = new RawIngestionOrchestrator(
    rawIngestionService,
    rawRecordRepository,
  );

  const metricRepository = new PrismaMetricRepository();

  const metricProcessingService = new MetricProcessingService(
    [
      new HuggingFaceMetricExtractor(),
      new HackerNewsMetricExtractor(),
      new ArxivMetricExtractor(),
    ],
    metricRepository,
  );

  const strategyRegistry = createForecastStrategyRegistry([
    new ProjectPopularityStrategy(),
    new DeveloperInterestStrategy(),
  ]);

  const forecastRepository = new PrismaForecastRepository();

  const forecastPersistenceService = new ForecastPersistenceService(
    forecastRepository,
  );

  const currentForecastService = new CurrentForecastService(forecastRepository);

  const forecastHistoryService = new ForecastHistoryService(forecastRepository);

  const forecastEntityRepository = new PrismaForecastEntityRepository();

  const refreshForecastService = new RefreshForecastService(
    forecastEntityRepository,
    rawIngestionOrchestrator,
    metricProcessingService,
    metricRepository,
    strategyRegistry,
    forecastPersistenceService,
    currentForecastService,
  );

  const dueForecastRepository = new PrismaDueForecastRepository();

  const dueForecastService = new DueForecastService(dueForecastRepository);

  const actualMetricsService = new ActualMetricsService(
    rawIngestionOrchestrator,
    metricProcessingService,
  );

  const forecastOutcomeRepository = new PrismaForecastOutcomeRepository();

  const forecastOutcomeService = new ForecastOutcomeService(
    forecastOutcomeRepository,
  );

  const forecastEvaluationService = new ForecastEvaluationService(
    dueForecastService,
    actualMetricsService,
    forecastOutcomeService,
  );

  return {
    entityService,
    currentForecastService,
    forecastHistoryService,
    refreshForecastService,
    forecastEvaluationService,
  };
};
