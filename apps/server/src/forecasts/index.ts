export type {
  ForecastMetricInput,
  ForecastPrediction,
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

export {
  InvalidForecastFactorError,
  createWeightedForecastFactor,
  createWeightedForecastFactors,
} from "./calculations/index.js";
