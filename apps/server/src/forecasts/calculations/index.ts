export {
  InvalidForecastFactorError,
  createWeightedForecastFactor,
  createWeightedForecastFactors,
} from "./weighted-factor.js";

export {
  DEVELOPER_INTEREST_THRESHOLDS,
  PROJECT_POPULARITY_THRESHOLDS,
  InvalidForecastScoreError,
  determineDeveloperInterestPrediction,
  determineProjectPopularityPrediction,
} from "./prediction.js";

export {
  CONFIDENCE_COMPONENT_WEIGHTS,
  FRESHNESS_THRESHOLDS,
  InvalidForecastConfidenceInputError,
  calculateForecastConfidence,
  isWithinForecastFreshnessWindow,
} from "./confidence.js";

export type {
  ForecastConfidenceInput,
  ForecastConfidenceResult,
  ForecastFreshnessWindowInput,
} from "./confidence.js";

export { calculateForecastRisk } from "./risk.js";

export type {
  ForecastRiskInput,
  ForecastRiskComponents,
  ForecastRiskResult,
} from "./risk.types.js";

export { createForecastRiskReason } from "./risk-reason.js";

export type { ForecastRiskReason } from "./risk-reason.js";

export {
  FORECAST_HORIZON_DAYS,
  HISTORICAL_LOOKBACK_DAYS,
  MAXIMUM_PROJECTED_CHANGE,
  MINIMUM_USABLE_HISTORY_DAYS,
  calculateForecastTrend,
  clampForecastValue,
  directionFromDelta,
  explainForecastFactors,
  selectForecastMetricPairs,
} from "./trend.js";

export type { ForecastMetricTrendPair, ForecastTrendResult } from "./trend.js";
