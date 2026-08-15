import { MetricType } from "@ai-oracle/shared";

import type { MetricNormalizationRule } from "./metric-normalization.types.js";

export const metricNormalizationRules: Partial<
  Record<MetricType, MetricNormalizationRule>
> = {
  [MetricType.Downloads]: {
    metricType: MetricType.Downloads,
    description: "Hugging Face downloads: logarithmic-like popularity bands.",
    thresholds: [
      { rawValue: 0, normalizedValue: 0 },
      { rawValue: 1_000, normalizedValue: 10 },
      { rawValue: 10_000, normalizedValue: 25 },
      { rawValue: 100_000, normalizedValue: 50 },
      { rawValue: 1_000_000, normalizedValue: 75 },
      { rawValue: 10_000_000, normalizedValue: 100 },
    ],
  },

  [MetricType.Likes]: {
    metricType: MetricType.Likes,
    description: "Hugging Face likes: cumulative community approval bands.",
    thresholds: [
      { rawValue: 0, normalizedValue: 0 },
      { rawValue: 10, normalizedValue: 10 },
      { rawValue: 100, normalizedValue: 30 },
      { rawValue: 1_000, normalizedValue: 60 },
      { rawValue: 5_000, normalizedValue: 85 },
      { rawValue: 10_000, normalizedValue: 100 },
    ],
  },

  [MetricType.Mentions]: {
    metricType: MetricType.Mentions,
    description: "Entity mentions within the selected aggregation window.",
    thresholds: [
      { rawValue: 0, normalizedValue: 0 },
      { rawValue: 1, normalizedValue: 20 },
      { rawValue: 3, normalizedValue: 40 },
      { rawValue: 10, normalizedValue: 60 },
      { rawValue: 30, normalizedValue: 80 },
      { rawValue: 100, normalizedValue: 100 },
    ],
  },

  [MetricType.Score]: {
    metricType: MetricType.Score,
    description: "Hacker News score representing community votes.",
    thresholds: [
      { rawValue: 0, normalizedValue: 0 },
      { rawValue: 10, normalizedValue: 20 },
      { rawValue: 50, normalizedValue: 40 },
      { rawValue: 100, normalizedValue: 60 },
      { rawValue: 300, normalizedValue: 80 },
      { rawValue: 1_000, normalizedValue: 100 },
    ],
  },

  [MetricType.Comments]: {
    metricType: MetricType.Comments,
    description: "Hacker News comment count representing discussion activity.",
    thresholds: [
      { rawValue: 0, normalizedValue: 0 },
      { rawValue: 5, normalizedValue: 20 },
      { rawValue: 20, normalizedValue: 40 },
      { rawValue: 50, normalizedValue: 60 },
      { rawValue: 150, normalizedValue: 80 },
      { rawValue: 500, normalizedValue: 100 },
    ],
  },

  [MetricType.Engagement]: {
    metricType: MetricType.Engagement,
    description:
      "Raw Hacker News engagement calculated as score plus comments.",
    thresholds: [
      { rawValue: 0, normalizedValue: 0 },
      { rawValue: 20, normalizedValue: 20 },
      { rawValue: 100, normalizedValue: 40 },
      { rawValue: 250, normalizedValue: 60 },
      { rawValue: 600, normalizedValue: 80 },
      { rawValue: 1_500, normalizedValue: 100 },
    ],
  },

  [MetricType.Publications]: {
    metricType: MetricType.Publications,
    description: "arXiv publications within the selected aggregation window.",
    thresholds: [
      { rawValue: 0, normalizedValue: 0 },
      { rawValue: 1, normalizedValue: 10 },
      { rawValue: 5, normalizedValue: 30 },
      { rawValue: 15, normalizedValue: 50 },
      { rawValue: 40, normalizedValue: 75 },
      { rawValue: 100, normalizedValue: 100 },
    ],
  },
} satisfies Partial<Record<MetricType, MetricNormalizationRule>>;
