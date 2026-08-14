export type EntityId = string;

export interface ForecastEntity {
  id: EntityId;
  name: string;
  symbol?: string;
  description?: string;
}
