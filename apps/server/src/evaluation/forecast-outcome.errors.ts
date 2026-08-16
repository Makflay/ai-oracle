export class ForecastOutcomeAlreadyExistsError extends Error {
  constructor(readonly forecastId: string) {
    super(`Forecast "${forecastId}" already has an outcome`);

    this.name = "ForecastOutcomeAlreadyExistsError";
  }
}
