import type { EntityId } from "./entities.js";
import {
  ForecastStatus,
  ForecastType,
  MetricType,
  PredictionDirection,
  RiskLevel,
} from "./enums.js";

export type ForecastId = string;

export interface ForecastFactor {
  metricType: MetricType;
  direction: PredictionDirection;
  weight: number;
  description: string;
}

export interface ForecastExplanation {
  summary: string;
  factors: ForecastFactor[];
}

export interface ForecastResult {
  direction: PredictionDirection;
  confidence: number;
  riskLevel: RiskLevel;
  predictedValue?: number;
  explanation: ForecastExplanation;
}

export interface Forecast {
  id: ForecastId;
  entityId: EntityId;
  type: ForecastType;
  status: ForecastStatus;
  createdAt: string;
  targetAt: string;
  result?: ForecastResult;
  failureReason?: string;
}
