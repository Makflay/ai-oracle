import type {
  ForecastStrategyInput,
  ForecastStrategyResult,
} from "./forecast-strategy.types.js";

export interface ForecastStrategy {
  readonly key: string;

  forecast(input: ForecastStrategyInput): Promise<ForecastStrategyResult>;
}
