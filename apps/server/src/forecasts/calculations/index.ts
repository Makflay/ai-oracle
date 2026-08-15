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
} from "./confidence.js";

export type {
  ForecastConfidenceInput,
  ForecastConfidenceResult,
} from "./confidence.js";
