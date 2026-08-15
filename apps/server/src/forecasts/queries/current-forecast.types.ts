import type {
  ForecastType,
  MetricType,
  PredictionDirection,
  RiskLevel,
} from "@ai-oracle/shared";

import type { ForecastExplainabilityMetadata } from "../persistence/index.js";

export interface CurrentForecastFactor {
  id: string;
  forecastId: string;
  metricId: string | null;
  sourceKey: string;
  metricType: MetricType;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  contribution: number;
  direction: PredictionDirection | null;
  description: string;
  position: number;
  createdAt: Date;
}

export interface CurrentForecastOutcome {
  id: string;
  forecastId: string;
  actualDirection: PredictionDirection;
  actualValue: number | null;
  accuracyScore: number | null;
  observedAt: Date;
  createdAt: Date;
}

export interface ForecastSnapshot {
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
  factors: readonly CurrentForecastFactor[];
  outcome: CurrentForecastOutcome | null;
}
