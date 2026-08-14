import type {
  DataSourceFetchOptions,
  DataSourceResult,
} from "./data-source.types.js";

export interface DataSource<T> {
  readonly key: string;

  fetch(options?: DataSourceFetchOptions): Promise<DataSourceResult<T>>;
}
