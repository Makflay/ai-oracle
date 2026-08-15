import { RiskLevel } from "@ai-oracle/shared";

export interface ForecastRiskInput {
  confidence: number;
  sourceConsistency: number;
  freshness: number;
  signalCoverage: number;
}

export interface ForecastRiskComponents {
  confidenceDeficit: number;
  sourceDisagreement: number;
  staleness: number;
  dataShortage: number;
}

export interface ForecastRiskResult {
  level: RiskLevel;
  score: number;
  components: ForecastRiskComponents;
}
