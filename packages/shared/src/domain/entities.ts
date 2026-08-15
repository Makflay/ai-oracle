export type EntityId = string;

export interface ForecastEntity {
  id: EntityId;
  name: string;
  slug: string;
  symbol: string | null;
  description: string | null;
}
