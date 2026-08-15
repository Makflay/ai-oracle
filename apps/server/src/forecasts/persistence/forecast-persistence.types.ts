import type { ForecastType, RiskLevel } from "@ai-oracle/shared";

import type { ForecastRiskReason } from "../calculations/index.js";

export interface ForecastExplainabilityMetadata {
  summary: string;
  riskReason: ForecastRiskReason;
}

export interface CreateForecastSnapshot {
  entityId: string;
  forecastType: ForecastType;
  score: number;
  confidence: number;
  risk: RiskLevel;
  prediction: string;
  predictedValue: number;
  targetAt: Date;
  createdAt: Date;
  explainability: ForecastExplainabilityMetadata;
}

export interface StoredForecastSnapshot {
  id: string;
  entityId: string;
  forecastType: ForecastType;
  score: number;
  confidence: number | null;
  risk: RiskLevel;
  prediction: string;
  predictedValue: number | null;
  targetAt: Date;
  createdAt: Date;
  explainability: ForecastExplainabilityMetadata;
}

export interface ForecastPersistence {
  create(snapshot: CreateForecastSnapshot): Promise<StoredForecastSnapshot>;
}
