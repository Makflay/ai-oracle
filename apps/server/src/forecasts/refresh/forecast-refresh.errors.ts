import type { RawIngestionFailure } from "../../ingestion/index.js";

export class ForecastUpstreamUnavailableError extends Error {
  constructor(readonly failures: readonly RawIngestionFailure[]) {
    super("Forecast refresh could not obtain data from external sources");

    this.name = "ForecastUpstreamUnavailableError";
  }
}
