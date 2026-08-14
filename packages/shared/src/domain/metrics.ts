import type { EntityId } from "./entities.js";
import { MetricType } from "./enums.js";

export type MetricId = string;

export interface Metric {
  id: MetricId;
  entityId: EntityId;
  type: MetricType;
  value: number;
  unit?: string;
  observedAt: string;
}
