import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

import type { ParsedArxivFeed, ParsedArxivPublication } from "./arxiv.types.js";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (_, path) =>
    typeof path === "string" &&
    (path === "feed.entry" ||
      path.endsWith(".author") ||
      path.endsWith(".category") ||
      path.endsWith(".link")),
});

const dateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Expected a valid date-time string",
  });

const authorSchema = z.object({
  name: z.string().trim().min(1),
});

const categorySchema = z.object({
  "@_term": z.string().trim().min(1),
});

const linkSchema = z.object({
  "@_href": z.string().trim().min(1),
  "@_title": z.string().trim().optional(),
  "@_type": z.string().trim().optional(),
  "@_rel": z.string().trim().optional(),
});

const primaryCategorySchema = z.object({
  "@_term": z.string().trim().min(1),
});

const entrySchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  published: dateTimeSchema,
  updated: dateTimeSchema,

  author: z.array(authorSchema).min(1),

  category: z.array(categorySchema).optional().default([]),

  link: z.array(linkSchema).optional().default([]),

  primary_category: primaryCategorySchema.optional(),
  doi: z.string().trim().min(1).optional(),
  journal_ref: z.string().trim().min(1).optional(),
});

const feedSchema = z.object({
  feed: z.object({
    totalResults: z.coerce.number().int().nonnegative(),

    entry: z.array(entrySchema).optional().default([]),
  }),
});

export class ArxivFeedParseError extends Error {
  readonly issues?: readonly unknown[];

  constructor(message: string, issues?: readonly unknown[]) {
    super(message);
    this.name = "ArxivFeedParseError";
    this.issues = issues ?? [];
  }
}

export function parseArxivFeed(xml: string): ParsedArxivFeed {
  let parsedXml: unknown;

  try {
    parsedXml = xmlParser.parse(xml);
  } catch (error: unknown) {
    throw new ArxivFeedParseError("arXiv returned malformed XML", [
      error instanceof Error ? error.message : "Unknown XML parsing error",
    ]);
  }

  const result = feedSchema.safeParse(parsedXml);

  if (!result.success) {
    throw new ArxivFeedParseError(
      "arXiv returned an invalid Atom feed",
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  return {
    totalResults: result.data.feed.totalResults,
    publications: result.data.feed.entry.map(mapPublication),
  };
}

function mapPublication(
  entry: z.infer<typeof entrySchema>,
): ParsedArxivPublication {
  const pdfLink = entry.link.find(
    (link) => link["@_title"] === "pdf" || link["@_type"] === "application/pdf",
  );

  return {
    arxivId: extractArxivId(entry.id),
    title: normalizeWhitespace(entry.title),
    summary: normalizeWhitespace(entry.summary),
    authors: entry.author.map((author) => author.name),
    categories: entry.category.map((category) => category["@_term"]),
    abstractUrl: entry.id,
    publishedAt: entry.published,
    updatedAt: entry.updated,

    ...(entry.primary_category
      ? {
          primaryCategory: entry.primary_category["@_term"],
        }
      : {}),

    ...(pdfLink
      ? {
          pdfUrl: pdfLink["@_href"],
        }
      : {}),

    ...(entry.doi
      ? {
          doi: entry.doi,
        }
      : {}),

    ...(entry.journal_ref
      ? {
          journalReference: entry.journal_ref,
        }
      : {}),
  };
}

function extractArxivId(abstractUrl: string): string {
  let url: URL;

  try {
    url = new URL(abstractUrl);
  } catch {
    throw new ArxivFeedParseError(
      `arXiv returned an invalid abstract URL: ${abstractUrl}`,
    );
  }

  const marker = "/abs/";
  const markerIndex = url.pathname.indexOf(marker);

  if (markerIndex === -1) {
    throw new ArxivFeedParseError(
      `arXiv abstract URL does not contain an ID: ${abstractUrl}`,
    );
  }

  const arxivId = url.pathname.slice(markerIndex + marker.length).trim();

  if (!arxivId) {
    throw new ArxivFeedParseError("arXiv returned an empty publication ID");
  }

  return arxivId;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
