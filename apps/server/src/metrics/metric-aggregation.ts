import { MetricType } from "@ai-oracle/shared";

import type { ExtractedMetric } from "./extractors/index.js";
import type { MetricSourceRecord } from "./metric-processing.types.js";

export interface ExtractedMetricObservation {
  readonly rawRecordId: string;
  readonly sourceKey: string;
  readonly entityId: string;
  readonly type: MetricType;
  readonly rawValue: number;
  readonly recordedAt: Date;
}

type AggregationRule = "SUM";

const aggregationRules: Readonly<
  Partial<Record<string, Partial<Record<MetricType, AggregationRule>>>>
> = {
  hacker_news: {
    [MetricType.Mentions]: "SUM",
    [MetricType.Score]: "SUM",
    [MetricType.Comments]: "SUM",
    [MetricType.Engagement]: "SUM",
  },
  arxiv: {
    [MetricType.Publications]: "SUM",
    [MetricType.Mentions]: "SUM",
  },
};

export function createMetricObservations(
  record: MetricSourceRecord,
  metrics: readonly ExtractedMetric[],
): readonly ExtractedMetricObservation[] {
  return metrics.map((metric) => ({
    rawRecordId: record.rawRecordId,
    sourceKey: record.sourceKey,
    entityId: record.entityId,
    type: metric.type,
    rawValue: metric.rawValue,
    recordedAt: record.recordedAt,
  }));
}

export function aggregateMetricObservations(
  observations: readonly ExtractedMetricObservation[],
): readonly ExtractedMetricObservation[] {
  const aggregatedByWindow = new Map<string, ExtractedMetricObservation>();
  const passthrough: ExtractedMetricObservation[] = [];

  for (const observation of observations) {
    const rule = aggregationRules[observation.sourceKey]?.[observation.type];

    if (!rule) {
      passthrough.push(observation);
      continue;
    }

    const key = createAggregationKey(observation);
    const current = aggregatedByWindow.get(key);

    if (!current) {
      aggregatedByWindow.set(key, observation);
      continue;
    }

    aggregatedByWindow.set(key, {
      ...current,
      rawRecordId:
        observation.rawRecordId < current.rawRecordId
          ? observation.rawRecordId
          : current.rawRecordId,
      rawValue: applyAggregationRule(
        rule,
        current.rawValue,
        observation.rawValue,
      ),
    });
  }

  return [...passthrough, ...aggregatedByWindow.values()];
}

function createAggregationKey(observation: ExtractedMetricObservation): string {
  return [
    observation.entityId,
    observation.sourceKey,
    observation.type,
    observation.recordedAt.getTime(),
  ].join(":");
}

function applyAggregationRule(
  rule: AggregationRule,
  currentValue: number,
  nextValue: number,
): number {
  switch (rule) {
    case "SUM":
      return currentValue + nextValue;
  }
}
