import type { MetricType } from "@ai-oracle/shared";

export interface ExtractedMetric {
  readonly type: MetricType;
  readonly rawValue: number;
}

export interface MetricExtractor {
  readonly sourceKey: string;

  extract(payload: unknown): readonly ExtractedMetric[];
}

export class InvalidMetricPayloadError extends Error {
  constructor(
    readonly sourceKey: string,
    readonly issues: readonly unknown[],
  ) {
    super(`Invalid raw payload for source "${sourceKey}"`);

    this.name = "InvalidMetricPayloadError";
  }
}
