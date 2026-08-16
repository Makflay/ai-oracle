import type {
  ForecastStatus,
  ForecastType,
  PredictionDirection,
  RiskLevel,
} from "@ai-oracle/shared";

export interface ForecastHistoryOutcome {
  id: string;
  forecastId: string;
  actualDirection: PredictionDirection;
  actualValue: number | null;
  accuracyScore: number | null;
  observedAt: Date;
  createdAt: Date;
}

export interface ForecastHistoryItem {
  id: string;
  entityId: string;
  forecastType: ForecastType;
  status: ForecastStatus;
  score: number;
  confidence: number | null;
  risk: RiskLevel;
  prediction: string;
  predictedValue: number | null;
  summary: string;
  targetAt: Date;
  createdAt: Date;
  outcome: ForecastHistoryOutcome | null;
}
