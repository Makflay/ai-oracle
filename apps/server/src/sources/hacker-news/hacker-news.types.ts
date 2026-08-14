export type HackerNewsFeed = "topstories" | "newstories" | "beststories";

export interface HackerNewsAdapterOptions {
  readonly keywords: readonly string[];
  readonly entitySlug?: string;
  readonly feed?: HackerNewsFeed;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly scanMultiplier?: number;
  readonly concurrency?: number;
}

export interface HackerNewsStoryData {
  readonly entitySlug?: string;
  readonly storyId: number;
  readonly author: string;
  readonly title: string;
  readonly url?: string;
  readonly text?: string;
  readonly score: number;
  readonly commentCount: number;
  readonly mentionCount: number;
  readonly matchedKeywords: readonly string[];
  readonly childIds: readonly number[];
  readonly publishedAt: string;
}
