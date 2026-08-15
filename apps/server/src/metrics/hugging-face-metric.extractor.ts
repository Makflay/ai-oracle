import { MetricType } from "@ai-oracle/shared";
import { z } from "zod";

import type { ExtractedMetric, MetricExtractor } from "./metric-extractor.js";
import { InvalidMetricPayloadError } from "./metric-extractor.js";

const SOURCE_KEY = "hugging_face";

const huggingFacePayloadSchema = z.object({
  downloads: z.number().nonnegative(),
  likes: z.number().nonnegative(),
});

export class HuggingFaceMetricExtractor implements MetricExtractor {
  readonly sourceKey = SOURCE_KEY;

  extract(payload: unknown): readonly ExtractedMetric[] {
    const result = huggingFacePayloadSchema.safeParse(payload);

    if (!result.success) {
      throw new InvalidMetricPayloadError(this.sourceKey, result.error.issues);
    }

    return [
      {
        type: MetricType.Downloads,
        rawValue: result.data.downloads,
      },
      {
        type: MetricType.Likes,
        rawValue: result.data.likes,
      },
    ];
  }
}
