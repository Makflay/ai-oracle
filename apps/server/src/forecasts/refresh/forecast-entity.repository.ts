export interface ForecastEntityReference {
  readonly id: string;
  readonly slug: string;
}

export interface ForecastEntityRepository {
  findBySlug(slug: string): Promise<ForecastEntityReference | null>;
}
