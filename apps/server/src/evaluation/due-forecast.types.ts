import type {
  ForecastStatus,
  ForecastType,
  RiskLevel,
} from "@ai-oracle/shared";

export interface DueForecast {
  readonly id: string;
  readonly entityId: string;
  readonly forecastType: ForecastType;
  readonly status: ForecastStatus;
  readonly score: number;
  readonly confidence: number | null;
  readonly risk: RiskLevel;
  readonly prediction: string;
  readonly predictedValue: number | null;
  readonly targetAt: Date;
  readonly createdAt: Date;
}
