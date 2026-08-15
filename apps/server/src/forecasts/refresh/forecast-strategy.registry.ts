import type { ForecastStrategy } from "../contracts/index.js";

export type ForecastStrategyRegistry = ReadonlyMap<string, ForecastStrategy>;

export const createForecastStrategyRegistry = (
  strategies: readonly ForecastStrategy[],
): ForecastStrategyRegistry => {
  const registry = new Map<string, ForecastStrategy>();

  for (const strategy of strategies) {
    if (registry.has(strategy.key)) {
      throw new Error(`Duplicate forecast strategy "${strategy.key}"`);
    }

    registry.set(strategy.key, strategy);
  }

  return registry;
};
