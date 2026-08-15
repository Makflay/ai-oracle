import type {
  ForecastStrategyInput,
  ForecastStrategyResult,
} from "./forecast-strategy.types.js";

export interface ForecastStrategy<TPrediction extends string = string> {
  readonly key: string;

  forecast(
    input: ForecastStrategyInput,
  ): Promise<ForecastStrategyResult<TPrediction>>;
}
