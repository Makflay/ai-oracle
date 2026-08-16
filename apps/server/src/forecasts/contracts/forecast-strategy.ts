import type { ForecastKind } from "@ai-oracle/shared";

import type {
  ForecastStrategyInput,
  ForecastStrategyResult,
} from "./forecast-strategy.types.js";

export interface ForecastStrategy<TPrediction extends string = string> {
  readonly key: string;
  readonly kind: ForecastKind;

  forecast(
    input: ForecastStrategyInput,
  ): Promise<ForecastStrategyResult<TPrediction>>;
}
