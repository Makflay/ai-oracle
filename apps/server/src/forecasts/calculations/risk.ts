import { RiskLevel } from "@ai-oracle/shared";

import type { ForecastRiskInput, ForecastRiskResult } from "./risk.types.js";

export const RISK_COMPONENT_WEIGHTS = {
  confidenceDeficit: 0.4,
  sourceDisagreement: 0.25,
  staleness: 0.2,
  dataShortage: 0.15,
} as const;

export const RISK_THRESHOLDS = {
  high: 60,
  medium: 30,
} as const;

const clampToPercentage = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error("Risk component must be a finite number");
  }

  return Math.min(100, Math.max(0, value));
};

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const resolveRiskLevel = (riskScore: number): RiskLevel => {
  if (riskScore >= RISK_THRESHOLDS.high) {
    return RiskLevel.High;
  }

  if (riskScore >= RISK_THRESHOLDS.medium) {
    return RiskLevel.Medium;
  }

  return RiskLevel.Low;
};

export const calculateForecastRisk = (
  input: ForecastRiskInput,
): ForecastRiskResult => {
  const confidence = clampToPercentage(input.confidence);
  const sourceConsistency = clampToPercentage(input.sourceConsistency);
  const freshness = clampToPercentage(input.freshness);
  const signalCoverage = clampToPercentage(input.signalCoverage);

  const components = {
    confidenceDeficit: 100 - confidence,
    sourceDisagreement: 100 - sourceConsistency,
    staleness: 100 - freshness,
    dataShortage: 100 - signalCoverage,
  };

  const score = roundToTwoDecimals(
    components.confidenceDeficit * RISK_COMPONENT_WEIGHTS.confidenceDeficit +
      components.sourceDisagreement *
        RISK_COMPONENT_WEIGHTS.sourceDisagreement +
      components.staleness * RISK_COMPONENT_WEIGHTS.staleness +
      components.dataShortage * RISK_COMPONENT_WEIGHTS.dataShortage,
  );

  return {
    level: resolveRiskLevel(score),
    score,
    components,
  };
};
