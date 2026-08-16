export class ForecastNotEvaluableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForecastNotEvaluableError";
  }
}

export class IncompleteActualMetricsError extends Error {
  constructor(readonly missingFactorIds: readonly string[]) {
    super(
      "Forecast evaluation is missing actual " +
        `metrics for factors: ${missingFactorIds.join(", ")}`,
    );

    this.name = "IncompleteActualMetricsError";
  }
}
