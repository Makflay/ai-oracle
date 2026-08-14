export interface ArxivAdapterOptions {
  readonly keywords: readonly string[];
  readonly entitySlug?: string;
  readonly categories?: readonly string[];
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly userAgent?: string;
}

export interface ArxivPublicationData {
  readonly entitySlug?: string;
  readonly arxivId: string;
  readonly title: string;
  readonly summary: string;
  readonly authors: readonly string[];
  readonly categories: readonly string[];
  readonly primaryCategory?: string;
  readonly abstractUrl: string;
  readonly pdfUrl?: string;
  readonly doi?: string;
  readonly journalReference?: string;
  readonly publishedAt: string;
  readonly updatedAt: string;
  readonly mentionCount: number;
  readonly matchedKeywords: readonly string[];
}

export interface ParsedArxivPublication {
  readonly arxivId: string;
  readonly title: string;
  readonly summary: string;
  readonly authors: readonly string[];
  readonly categories: readonly string[];
  readonly primaryCategory?: string;
  readonly abstractUrl: string;
  readonly pdfUrl?: string;
  readonly doi?: string;
  readonly journalReference?: string;
  readonly publishedAt: string;
  readonly updatedAt: string;
}

export interface ParsedArxivFeed {
  readonly totalResults: number;
  readonly publications: readonly ParsedArxivPublication[];
}
