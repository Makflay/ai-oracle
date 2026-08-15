import { MetricType } from "@ai-oracle/shared";
import { z } from "zod";

import type { ExtractedMetric, MetricExtractor } from "./metric-extractor.js";
import { InvalidMetricPayloadError } from "./metric-extractor.js";

const SOURCE_KEY = "hacker_news";

const hackerNewsPayloadSchema = z.object({
  mentionCount: z.number().finite().nonnegative(),
  score: z.number().finite().nonnegative(),
  commentCount: z.number().finite().nonnegative(),
});

export class HackerNewsMetricExtractor implements MetricExtractor {
  readonly sourceKey = SOURCE_KEY;

  extract(payload: unknown): readonly ExtractedMetric[] {
    const result = hackerNewsPayloadSchema.safeParse(payload);

    if (!result.success) {
      throw new InvalidMetricPayloadError(this.sourceKey, result.error.issues);
    }

    const { mentionCount, score, commentCount } = result.data;

    return [
      {
        type: MetricType.Mentions,
        rawValue: mentionCount,
      },
      {
        type: MetricType.Score,
        rawValue: score,
      },
      {
        type: MetricType.Comments,
        rawValue: commentCount,
      },
      {
        type: MetricType.Engagement,
        rawValue: score + commentCount,
      },
    ];
  }
}
