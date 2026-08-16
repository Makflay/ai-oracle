import type {
  ForecastType,
  RiskLevel,
  MetricType,
  PredictionDirection,
  ForecastKind,
} from "@ai-oracle/shared";

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
  factors: readonly CreateForecastFactorSnapshot[];
  forecastKind: ForecastKind;
}

export interface CreateForecastFactorSnapshot {
  metricId: string | null;
  sourceKey: string;
  metricType: MetricType;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  contribution: number;
  direction?: PredictionDirection | null;
  description: string;
  position: number;
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
  factors: readonly CreateForecastFactorSnapshot[];
  forecastKind: ForecastKind;
}

export interface ForecastPersistence {
  create(snapshot: CreateForecastSnapshot): Promise<StoredForecastSnapshot>;
}
