export type {
  ForecastMetricInput,
  ForecastStrategy,
  ForecastStrategyFactor,
  ForecastStrategyInput,
  ForecastStrategyResult,
} from "./contracts/index.js";

export {
  InsufficientForecastMetricsError,
  InvalidForecastHorizonError,
  ProjectPopularityStrategy,
  DeveloperInterestStrategy,
  InsufficientDeveloperInterestMetricsError,
  InvalidDeveloperInterestHorizonError,
} from "./strategies/index.js";

export type {
  ForecastConfidenceInput,
  ForecastConfidenceResult,
} from "./calculations/index.js";

export {
  DEVELOPER_INTEREST_THRESHOLDS,
  PROJECT_POPULARITY_THRESHOLDS,
  InvalidForecastFactorError,
  createWeightedForecastFactor,
  createWeightedForecastFactors,
  InvalidForecastScoreError,
  determineDeveloperInterestPrediction,
  determineProjectPopularityPrediction,
  CONFIDENCE_COMPONENT_WEIGHTS,
  FRESHNESS_THRESHOLDS,
  InvalidForecastConfidenceInputError,
  calculateForecastConfidence,
} from "./calculations/index.js";

export type {
  ForecastExplainabilityMetadata,
  CreateForecastSnapshot,
  StoredForecastSnapshot,
  ForecastPersistence,
} from "./persistence/index.ts";

export type {
  CurrentForecastRepository,
  FindCurrentForecastInput,
  ForecastSnapshot,
  CurrentForecastFactor,
  CurrentForecastOutcome,
  FindForecastHistoryInput,
  ForecastHistoryRepository,
} from "./queries/index.js";

export {
  CurrentForecastService,
  ForecastHistoryService,
} from "./queries/index.js";

export type {
  ForecastStrategyRegistry,
  RefreshForecastInput,
  RefreshForecastResult,
} from "./refresh/index.js";

export {
  createForecastStrategyRegistry,
  RefreshForecastService,
} from "./refresh/index.js";

export type { ProjectForecastControllerDependencies } from "./api/index.js";

export {
  ProjectForecastController,
  createProjectForecastRouter,
  toProjectForecastDto,
} from "./api/index.js";
