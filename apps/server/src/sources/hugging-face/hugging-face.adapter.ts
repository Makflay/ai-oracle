import { z } from "zod";

import { config } from "../../config/index.js";
import type { DataSource } from "../data-source.js";
import { DataSourceErrorCode } from "../data-source.types.js";
import type {
  DataSourceFetchOptions,
  DataSourceResult,
} from "../data-source.types.js";
import type {
  HuggingFaceAdapterOptions,
  HuggingFaceModelData,
} from "./hugging-face.types.js";

const DEFAULT_BASE_URL = "https://huggingface.co";

const huggingFaceResponseSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1).nullish(),
  sha: z.string().min(1).nullish(),
  downloads: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  pipeline_tag: z.string().min(1).nullish(),
  tags: z.array(z.string()).optional().default([]),
  createdAt: z.string().min(1).nullish(),
  lastModified: z.string().min(1).nullish(),
  private: z.boolean().optional().default(false),
  disabled: z.boolean().optional().default(false),
});

type HuggingFaceResponse = z.infer<typeof huggingFaceResponseSchema>;

export class HuggingFaceDataSource implements DataSource<HuggingFaceModelData> {
  readonly key = "hugging_face";

  private readonly entitySlug: string;
  private readonly modelId: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: HuggingFaceAdapterOptions) {
    this.entitySlug = options.entitySlug;
    this.modelId = options.modelId;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? config.sources.requestTimeoutMs;
  }

  async fetch(
    options?: DataSourceFetchOptions,
  ): Promise<DataSourceResult<HuggingFaceModelData>> {
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const signal = options?.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal;

    try {
      const response = await fetch(this.createModelUrl(), {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        signal,
      });

      if (!response.ok) {
        return this.createHttpFailure(response.status);
      }

      const payload: unknown = await response.json();
      const parsed = huggingFaceResponseSchema.safeParse(payload);

      if (!parsed.success) {
        return {
          success: false,
          error: {
            code: DataSourceErrorCode.InvalidResponse,
            message: "Hugging Face returned an invalid model response",
            retryable: false,
            details: {
              modelId: this.modelId,
              issues: parsed.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },
          },
        };
      }

      return {
        success: true,
        items: [this.mapModel(parsed.data)],
        fetchedAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return this.createFetchFailure(error, options?.signal);
    }
  }

  private createModelUrl(): URL {
    const encodedModelId = this.modelId
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");

    const baseUrl = this.baseUrl.endsWith("/")
      ? this.baseUrl
      : `${this.baseUrl}/`;

    return new URL(`api/models/${encodedModelId}`, baseUrl);
  }

  private mapModel(response: HuggingFaceResponse): HuggingFaceModelData {
    return {
      entitySlug: this.entitySlug,
      modelId: response.id,
      downloads: response.downloads,
      likes: response.likes,
      tags: response.tags,
      isPrivate: response.private,
      isDisabled: response.disabled,
      ...(response.author ? { author: response.author } : {}),
      ...(response.sha ? { sha: response.sha } : {}),
      ...(response.pipeline_tag ? { pipelineTag: response.pipeline_tag } : {}),
      ...(response.createdAt ? { createdAt: response.createdAt } : {}),
      ...(response.lastModified ? { lastModified: response.lastModified } : {}),
    };
  }

  private createHttpFailure(
    statusCode: number,
  ): DataSourceResult<HuggingFaceModelData> {
    if (statusCode === 401 || statusCode === 403) {
      return {
        success: false,
        error: {
          code: DataSourceErrorCode.Unauthorized,
          message: "Hugging Face rejected access to the model",
          retryable: false,
          statusCode,
          details: {
            modelId: this.modelId,
          },
        },
      };
    }

    if (statusCode === 429) {
      return {
        success: false,
        error: {
          code: DataSourceErrorCode.RateLimit,
          message: "Hugging Face rate limit was exceeded",
          retryable: true,
          statusCode,
          details: {
            modelId: this.modelId,
          },
        },
      };
    }

    return {
      success: false,
      error: {
        code: DataSourceErrorCode.Network,
        message: `Hugging Face request failed with status ${statusCode}`,
        retryable: statusCode >= 500,
        statusCode,
        details: {
          modelId: this.modelId,
        },
      },
    };
  }

  private createFetchFailure(
    error: unknown,
    externalSignal?: AbortSignal,
  ): DataSourceResult<HuggingFaceModelData> {
    if (externalSignal?.aborted) {
      return {
        success: false,
        error: {
          code: DataSourceErrorCode.Unknown,
          message: "Hugging Face request was cancelled",
          retryable: false,
          details: {
            modelId: this.modelId,
          },
        },
      };
    }

    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return {
        success: false,
        error: {
          code: DataSourceErrorCode.Timeout,
          message: `Hugging Face request exceeded ${this.timeoutMs} ms`,
          retryable: true,
          details: {
            modelId: this.modelId,
          },
        },
      };
    }

    return {
      success: false,
      error: {
        code: DataSourceErrorCode.Network,
        message: "Unable to reach Hugging Face",
        retryable: true,
        details: {
          modelId: this.modelId,
          cause: error instanceof Error ? error.message : "Unknown fetch error",
        },
      },
    };
  }
}
