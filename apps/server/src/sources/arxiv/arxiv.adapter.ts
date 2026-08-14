import { config } from "../../config/index.js";
import type { DataSource } from "../data-source.js";
import { DataSourceErrorCode } from "../data-source.types.js";
import type {
  DataSourceFetchOptions,
  DataSourceResult,
} from "../data-source.types.js";
import { ArxivFeedParseError, parseArxivFeed } from "./arxiv.atom-parser.js";
import type {
  ArxivAdapterOptions,
  ArxivPublicationData,
  ParsedArxivPublication,
} from "./arxiv.types.js";

const DEFAULT_BASE_URL = "https://export.arxiv.org/api";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const DEFAULT_CATEGORIES = [
  "cs.AI",
  "cs.CL",
  "cs.CV",
  "cs.LG",
  "stat.ML",
] as const;

const DEFAULT_USER_AGENT = "AIOracle/0.1";

class ArxivHttpError extends Error {
  constructor(readonly statusCode: number) {
    super(`arXiv request failed with status ${statusCode}`);
    this.name = "ArxivHttpError";
  }
}

export class ArxivDataSource implements DataSource<ArxivPublicationData> {
  readonly key = "arxiv";

  private readonly keywords: readonly string[];
  private readonly entitySlug?: string | undefined;
  private readonly categories: readonly string[];
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly userAgent: string;

  constructor(options: ArxivAdapterOptions) {
    const keywords = options.keywords
      .map((keyword) => keyword.trim().toLowerCase())
      .filter((keyword) => keyword.length > 0);

    if (keywords.length === 0) {
      throw new Error("ArxivDataSource requires at least one keyword");
    }

    const categories = (options.categories ?? DEFAULT_CATEGORIES)
      .map((category) => category.trim())
      .filter((category) => category.length > 0);

    this.keywords = [...new Set(keywords)];
    this.entitySlug = options.entitySlug;
    this.categories = [...new Set(categories)];
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? config.sources.requestTimeoutMs;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  }

  async fetch(
    options?: DataSourceFetchOptions,
  ): Promise<DataSourceResult<ArxivPublicationData>> {
    const start = this.parseCursor(options?.cursor);

    if (start === null) {
      return {
        success: false,
        error: {
          code: DataSourceErrorCode.InvalidResponse,
          message: "arXiv cursor must be a non-negative integer",
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
      const response = await fetch(this.createQueryUrl(start, limit), {
        method: "GET",
        headers: {
          accept: "application/atom+xml",
          "user-agent": this.userAgent,
        },
        signal,
      });

      if (!response.ok) {
        throw new ArxivHttpError(response.status);
      }

      const xml = await response.text();
      const feed = parseArxivFeed(xml);

      const publications = feed.publications.map((publication) =>
        this.mapPublication(publication),
      );

      const nextStart = start + publications.length;
      const nextCursor =
        publications.length > 0 && nextStart < feed.totalResults
          ? String(nextStart)
          : undefined;

      return {
        success: true,
        items: publications,
        fetchedAt: new Date().toISOString(),
        ...(nextCursor ? { nextCursor } : {}),
      };
    } catch (error: unknown) {
      return this.createFailure(error, options?.signal);
    }
  }

  private createQueryUrl(start: number, limit: number): URL {
    const baseUrl = this.baseUrl.endsWith("/")
      ? this.baseUrl
      : `${this.baseUrl}/`;

    const url = new URL("query", baseUrl);

    url.searchParams.set("search_query", this.createSearchQuery());
    url.searchParams.set("start", String(start));
    url.searchParams.set("max_results", String(limit));
    url.searchParams.set("sortBy", "submittedDate");
    url.searchParams.set("sortOrder", "descending");

    return url;
  }

  private createSearchQuery(): string {
    const keywordQuery = this.keywords
      .map((keyword) => {
        const escapedKeyword = keyword.replace(/"/g, '\\"');

        return `(ti:"${escapedKeyword}"` + ` OR abs:"${escapedKeyword}")`;
      })
      .join(" OR ");

    if (this.categories.length === 0) {
      return `(${keywordQuery})`;
    }

    const categoryQuery = this.categories
      .map((category) => `cat:${category}`)
      .join(" OR ");

    return `(${keywordQuery}) AND (${categoryQuery})`;
  }

  private mapPublication(
    publication: ParsedArxivPublication,
  ): ArxivPublicationData {
    const searchableText = [publication.title, publication.summary]
      .join(" ")
      .toLowerCase();

    const matches = this.findKeywordMatches(searchableText);

    return {
      ...publication,
      mentionCount: matches.mentionCount,
      matchedKeywords: matches.matchedKeywords,
      ...(this.entitySlug ? { entitySlug: this.entitySlug } : {}),
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
    if (limit === undefined || !Number.isFinite(limit)) {
      return DEFAULT_LIMIT;
    }

    return Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
  }

  private createFailure(
    error: unknown,
    externalSignal?: AbortSignal,
  ): DataSourceResult<ArxivPublicationData> {
    if (externalSignal?.aborted) {
      return {
        success: false,
        error: {
          code: DataSourceErrorCode.Unknown,
          message: "arXiv request was cancelled",
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
          message: `arXiv request exceeded ${this.timeoutMs} ms`,
          retryable: true,
        },
      };
    }

    if (error instanceof ArxivHttpError) {
      if (error.statusCode === 429) {
        return {
          success: false,
          error: {
            code: DataSourceErrorCode.RateLimit,
            message: "arXiv rate limit was exceeded",
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
            message: "arXiv rejected the request",
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

    if (error instanceof ArxivFeedParseError) {
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
        message: "Unable to reach arXiv",
        retryable: true,
        details: {
          cause: error instanceof Error ? error.message : "Unknown fetch error",
        },
      },
    };
  }
}
