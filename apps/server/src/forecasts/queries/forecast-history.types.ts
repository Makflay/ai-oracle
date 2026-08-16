import type {
  ForecastStatus,
  ForecastType,
  RiskLevel,
  EvaluationStatus,
  ForecastKind,
} from "@ai-oracle/shared";

export interface ForecastHistoryOutcome {
  id: string;
  forecastId: string;
  actualValue: number;
  expectedValue: number;
  status: EvaluationStatus;
  evaluatedAt: Date;
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
  forecastKind: ForecastKind;
}
