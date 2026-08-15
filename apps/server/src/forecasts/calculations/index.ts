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
