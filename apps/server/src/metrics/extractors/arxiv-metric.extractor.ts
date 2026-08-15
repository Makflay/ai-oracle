import { MetricType } from "@ai-oracle/shared";
import { z } from "zod";

import type { ExtractedMetric, MetricExtractor } from "./metric-extractor.js";
import { InvalidMetricPayloadError } from "./metric-extractor.js";

const SOURCE_KEY = "arxiv";

const arxivPayloadSchema = z.object({
  arxivId: z.string().trim().min(1),
  mentionCount: z.number().finite().nonnegative(),
});

export class ArxivMetricExtractor implements MetricExtractor {
  readonly sourceKey = SOURCE_KEY;

  extract(payload: unknown): readonly ExtractedMetric[] {
    const result = arxivPayloadSchema.safeParse(payload);

    if (!result.success) {
      throw new InvalidMetricPayloadError(this.sourceKey, result.error.issues);
    }

    return [
      {
        type: MetricType.Publications,
        rawValue: 1,
      },
      {
        type: MetricType.Mentions,
        rawValue: result.data.mentionCount,
      },
    ];
  }
}
