import { z } from "zod";

import { config } from "../../config/index.js";
import type { DataSource } from "../data-source.js";
import { DataSourceErrorCode } from "../data-source.types.js";
import type {
  DataSourceFetchOptions,
  DataSourceResult,
} from "../data-source.types.js";
import type {
  HackerNewsAdapterOptions,
  HackerNewsFeed,
  HackerNewsStoryData,
  HackerNewsObservationData,
} from "./hacker-news.types.js";

const DEFAULT_BASE_URL = "https://hacker-news.firebaseio.com/v0";

const MAX_LIMIT = 100;
const DEFAULT_SCAN_MULTIPLIER = 5;
const DEFAULT_CONCURRENCY = 10;

const storyIdsSchema = z.array(z.number().int().positive());

const hackerNewsItemSchema = z.object({
  id: z.number().int().positive(),
  type: z.string().optional(),
  by: z.string().optional(),
  time: z.number().int().nonnegative().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  text: z.string().optional(),
  score: z.number().int().nonnegative().optional(),
  descendants: z.number().int().nonnegative().optional(),
  kids: z.array(z.number().int().positive()).optional(),
  deleted: z.boolean().optional(),
  dead: z.boolean().optional(),
});

type HackerNewsItem = z.infer<typeof hackerNewsItemSchema>;

class HackerNewsHttpError extends Error {
  constructor(readonly statusCode: number) {
    super(`Hacker News request failed with status ${statusCode}`);

    this.name = "HackerNewsHttpError";
  }
}

class HackerNewsResponseError extends Error {
  constructor(
    message: string,
    readonly issues?: readonly unknown[],
  ) {
    super(message);
    this.name = "HackerNewsResponseError";
  }
}

export class HackerNewsDataSource implements DataSource<HackerNewsObservationData> {
  readonly key = "hacker_news";

  private readonly keywords: readonly string[];
  private readonly entitySlug?: string | undefined;
  private readonly feed: HackerNewsFeed;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly scanMultiplier: number;
  private readonly concurrency: number;

  constructor(options: HackerNewsAdapterOptions) {
    const keywords = options.keywords
      .map((keyword) => keyword.trim().toLowerCase())
      .filter((keyword) => keyword.length > 0);

    if (keywords.length === 0) {
      throw new Error("HackerNewsDataSource requires at least one keyword");
    }

    this.keywords = [...new Set(keywords)];
    this.entitySlug = options.entitySlug;
    this.feed = options.feed ?? "newstories";
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? config.sources.requestTimeoutMs;

    this.scanMultiplier = Math.max(
      1,
      Math.floor(options.scanMultiplier ?? DEFAULT_SCAN_MULTIPLIER),
    );

    this.concurrency = Math.max(
      1,
      Math.floor(options.concurrency ?? DEFAULT_CONCURRENCY),
    );
  }

  async fetch(
    options?: DataSourceFetchOptions,
  ): Promise<DataSourceResult<HackerNewsObservationData>> {
    const offset = this.parseCursor(options?.cursor);

    if (offset === null) {
      return {
        success: false,
        error: {
          code: DataSourceErrorCode.InvalidResponse,
          message: "Hacker News cursor must be a non-negative integer",
          retryable: false,
          details: {
            cursor: options?.cursor,
          },
        },
      };
    }

    const limit = this.normalizeLimit(options?.limit);
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const signal = options?.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal;

    try {
      const storyIds = await this.fetchStoryIds(signal);

      const scanLimit = Math.min(
        limit * this.scanMultiplier,
        storyIds.length - offset,
      );

      const candidateIds = storyIds.slice(
        offset,
        offset + Math.max(0, scanLimit),
      );

      const stories: HackerNewsStoryData[] = [];
      let consumedIds = 0;

      for (
        let index = 0;
        index < candidateIds.length && stories.length < limit;
        index += this.concurrency
      ) {
        const batchIds = candidateIds.slice(index, index + this.concurrency);

        const batchItems = await Promise.all(
          batchIds.map((storyId) => this.fetchItem(storyId, signal)),
        );

        for (const item of batchItems) {
          consumedIds += 1;

          const story = this.mapRelevantStory(item);

          if (story) {
            stories.push(story);
          }

          if (stories.length >= limit) {
            break;
          }
        }
      }

      const nextOffset = offset + consumedIds;
      const nextCursor =
        nextOffset < storyIds.length ? String(nextOffset) : undefined;

      const items: readonly HackerNewsObservationData[] =
        stories.length > 0
          ? stories
          : [
              {
                mentionCount: 0,
                score: 0,
                commentCount: 0,
                matchedKeywords: [],
                scannedStoryCount: candidateIds.length,
              },
            ];

      return {
        success: true,
        items,
        fetchedAt: new Date().toISOString(),
        ...(nextCursor ? { nextCursor } : {}),
      };
    } catch (error: unknown) {
      return this.createFailure(error, options?.signal);
    }
  }

  private async fetchStoryIds(signal: AbortSignal): Promise<readonly number[]> {
    const payload = await this.fetchJson(`${this.feed}.json`, signal);

    const parsed = storyIdsSchema.safeParse(payload);

    if (!parsed.success) {
      throw new HackerNewsResponseError(
        "Hacker News returned an invalid story ID list",
        parsed.error.issues,
      );
    }

    return parsed.data;
  }

  private async fetchItem(
    storyId: number,
    signal: AbortSignal,
  ): Promise<HackerNewsItem | null> {
    const payload = await this.fetchJson(`item/${storyId}.json`, signal);

    if (payload === null) {
      return null;
    }

    const parsed = hackerNewsItemSchema.safeParse(payload);

    if (!parsed.success) {
      throw new HackerNewsResponseError(
        `Hacker News returned an invalid item ${storyId}`,
        parsed.error.issues,
      );
    }

    return parsed.data;
  }

  private async fetchJson(path: string, signal: AbortSignal): Promise<unknown> {
    const baseUrl = this.baseUrl.endsWith("/")
      ? this.baseUrl
      : `${this.baseUrl}/`;

    const response = await fetch(new URL(path, baseUrl), {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      signal,
    });

    if (!response.ok) {
      throw new HackerNewsHttpError(response.status);
    }

    try {
      return await response.json();
    } catch {
      throw new HackerNewsResponseError("Hacker News returned invalid JSON");
    }
  }

  private mapRelevantStory(
    item: HackerNewsItem | null,
  ): HackerNewsStoryData | null {
    if (
      !item ||
      item.type !== "story" ||
      item.deleted ||
      item.dead ||
      !item.title ||
      !item.by ||
      item.time === undefined
    ) {
      return null;
    }

    const searchableText = [item.title, item.text, item.url]
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .toLowerCase();

    const matches = this.findKeywordMatches(searchableText);

    if (matches.mentionCount === 0) {
      return null;
    }

    return {
      storyId: item.id,
      author: item.by,
      title: item.title,
      score: item.score ?? 0,
      commentCount: item.descendants ?? 0,
      mentionCount: matches.mentionCount,
      matchedKeywords: matches.matchedKeywords,
      childIds: item.kids ?? [],
      publishedAt: new Date(item.time * 1_000).toISOString(),
      ...(this.entitySlug ? { entitySlug: this.entitySlug } : {}),
      ...(item.url ? { url: item.url } : {}),
      ...(item.text ? { text: item.text } : {}),
    };
  }

  private findKeywordMatches(searchableText: string): {
    mentionCount: number;
    matchedKeywords: readonly string[];
  } {
    const matchedKeywords: string[] = [];
    let mentionCount = 0;

    for (const keyword of this.keywords) {
      let searchFrom = 0;
      let keywordMentions = 0;

      while (searchFrom < searchableText.length) {
        const matchIndex = searchableText.indexOf(keyword, searchFrom);

        if (matchIndex === -1) {
          break;
        }

        keywordMentions += 1;
        searchFrom = matchIndex + keyword.length;
      }

      if (keywordMentions > 0) {
        matchedKeywords.push(keyword);
        mentionCount += keywordMentions;
      }
    }

    return {
      mentionCount,
      matchedKeywords,
    };
  }

  private parseCursor(cursor: string | undefined): number | null {
    if (cursor === undefined) {
      return 0;
    }

    if (!/^\d+$/.test(cursor)) {
      return null;
    }

    const value = Number(cursor);

    return Number.isSafeInteger(value) ? value : null;
  }

  private normalizeLimit(limit: number | undefined): number {
    const requestedLimit = limit ?? config.sources.requestLimit;

    return Math.min(MAX_LIMIT, Math.max(1, Math.floor(requestedLimit)));
  }

  private createFailure(
    error: unknown,
    externalSignal?: AbortSignal,
  ): DataSourceResult<HackerNewsObservationData> {
    if (externalSignal?.aborted) {
      return {
        success: false,
        error: {
          code: DataSourceErrorCode.Unknown,
          message: "Hacker News request was cancelled",
          retryable: false,
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
          message: `Hacker News request exceeded ${this.timeoutMs} ms`,
          retryable: true,
        },
      };
    }

    if (error instanceof HackerNewsHttpError) {
      if (error.statusCode === 429) {
        return {
          success: false,
          error: {
            code: DataSourceErrorCode.RateLimit,
            message: "Hacker News rate limit was exceeded",
            retryable: true,
            statusCode: error.statusCode,
          },
        };
      }

      if (error.statusCode === 401 || error.statusCode === 403) {
        return {
          success: false,
          error: {
            code: DataSourceErrorCode.Unauthorized,
            message: "Hacker News rejected the request",
            retryable: false,
            statusCode: error.statusCode,
          },
        };
      }

      return {
        success: false,
        error: {
          code: DataSourceErrorCode.Network,
          message: error.message,
          retryable: error.statusCode >= 500,
          statusCode: error.statusCode,
        },
      };
    }

    if (error instanceof HackerNewsResponseError) {
      return {
        success: false,
        error: {
          code: DataSourceErrorCode.InvalidResponse,
          message: error.message,
          retryable: false,
          ...(error.issues
            ? {
                details: {
                  issues: error.issues,
                },
              }
            : {}),
        },
      };
    }

    return {
      success: false,
      error: {
        code: DataSourceErrorCode.Network,
        message: "Unable to reach Hacker News",
        retryable: true,
        details: {
          cause: error instanceof Error ? error.message : "Unknown fetch error",
        },
      },
    };
  }
}
