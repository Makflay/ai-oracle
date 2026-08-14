export interface HuggingFaceAdapterOptions {
  readonly entitySlug: string;
  readonly modelId: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
}

export interface HuggingFaceModelData {
  readonly entitySlug: string;
  readonly modelId: string;
  readonly author?: string;
  readonly sha?: string;
  readonly downloads: number;
  readonly likes: number;
  readonly pipelineTag?: string;
  readonly tags: readonly string[];
  readonly createdAt?: string;
  readonly lastModified?: string;
  readonly isPrivate: boolean;
  readonly isDisabled: boolean;
}
