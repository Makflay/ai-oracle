import { DataSourceErrorCode } from "../sources/index.js";
import type {
  DataSource,
  DataSourceError,
  DataSourceResult,
} from "../sources/index.js";
import type {
  EntitySourceRegistry,
  RawIngestionFailure,
  RawIngestionOptions,
  RawIngestionRecord,
  RawIngestionResult,
} from "./raw-ingestion.types.js";

interface SourceExecutionResult {
  readonly records: readonly RawIngestionRecord[];
  readonly failure?: RawIngestionFailure;
}

export class RawIngestionService {
  private readonly sourcesByEntity: ReadonlyMap<
    string,
    readonly DataSource<unknown>[]
  >;

  constructor(registry: EntitySourceRegistry) {
    this.sourcesByEntity = new Map(
      Object.entries(registry).map(([entity, sources]) => [
        entity,
        [...sources],
      ]),
    );
  }

  async ingest(
    entity: string,
    options?: RawIngestionOptions,
  ): Promise<RawIngestionResult> {
    const normalizedEntity = entity.trim();

    if (!normalizedEntity) {
      throw new Error("RawIngestionService requires a non-empty entity");
    }

    const sources = this.sourcesByEntity.get(normalizedEntity);

    if (!sources || sources.length === 0) {
      throw new Error(
        `No data sources configured for entity "${normalizedEntity}"`,
      );
    }

    const executions = await Promise.all(
      sources.map((source) =>
        this.executeSource(source, normalizedEntity, options),
      ),
    );

    return {
      records: executions.flatMap((execution) => execution.records),

      failures: executions.flatMap((execution) =>
        execution.failure ? [execution.failure] : [],
      ),
    };
  }

  private async executeSource(
    source: DataSource<unknown>,
    entity: string,
    options?: RawIngestionOptions,
  ): Promise<SourceExecutionResult> {
    let result: DataSourceResult<unknown>;

    try {
      result = await source.fetch({
        ...(options?.limit !== undefined ? { limit: options.limit } : {}),
        ...(options?.signal ? { signal: options.signal } : {}),
      });
    } catch (error: unknown) {
      return {
        records: [],
        failure: {
          source: source.key,
          entity,
          error: this.createUnexpectedError(error),
        },
      };
    }

    if (!result.success) {
      return {
        records: [],
        failure: {
          source: source.key,
          entity,
          error: result.error,
        },
      };
    }

    return {
      records: result.items.map((payload) => ({
        source: source.key,
        entity,
        payload,
        fetchedAt: result.fetchedAt,
      })),
    };
  }

  private createUnexpectedError(error: unknown): DataSourceError {
    return {
      code: DataSourceErrorCode.Unknown,
      message: "Data source adapter threw an unexpected error",
      retryable: false,
      details: {
        cause: error instanceof Error ? error.message : "Unknown adapter error",
      },
    };
  }
}
