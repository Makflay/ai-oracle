import type {
  RawIngestionOptions,
  RawIngestionResult,
} from "./raw-ingestion.types.js";
import type {
  RawIngestionPersistence,
  RawPersistenceResult,
} from "./raw-ingestion.persistence.js";
import { RawIngestionService } from "./raw-ingestion.service.js";

export interface PersistedRawIngestionResult extends RawIngestionResult {
  readonly persistence: RawPersistenceResult;
}

export class RawIngestionOrchestrator {
  constructor(
    private readonly ingestionService: RawIngestionService,

    private readonly persistence: RawIngestionPersistence,
  ) {}

  async ingest(
    entity: string,
    options?: RawIngestionOptions,
  ): Promise<PersistedRawIngestionResult> {
    const ingestionResult = await this.ingestionService.ingest(entity, options);

    const persistenceResult = await this.persistence.save(
      ingestionResult.records,
    );

    return {
      records: ingestionResult.records,
      failures: ingestionResult.failures,
      persistence: persistenceResult,
    };
  }
}
