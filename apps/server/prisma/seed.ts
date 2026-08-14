import { prisma } from "../src/db/index.js";

const sources = [
  {
    key: "hugging_face",
    name: "Hugging Face",
    baseUrl: "https://huggingface.co",
  },
  {
    key: "hacker_news",
    name: "Hacker News",
    baseUrl: "https://hacker-news.firebaseio.com/v0",
  },
  {
    key: "arxiv",
    name: "arXiv",
    baseUrl: "https://export.arxiv.org/api",
  },
] as const;

const entities = [
  {
    slug: "qwen",
    name: "Qwen",
    symbol: "QWEN",
    description:
      "AI model family tracked for project popularity and developer interest.",
  },
  {
    slug: "deepseek",
    name: "DeepSeek",
    symbol: "DEEPSEEK",
    description:
      "AI model family tracked for project popularity and developer interest.",
  },
  {
    slug: "mistral",
    name: "Mistral",
    symbol: "MISTRAL",
    description:
      "AI model family tracked for project popularity and developer interest.",
  },
  {
    slug: "gemma",
    name: "Gemma",
    symbol: "GEMMA",
    description:
      "AI model family tracked for project popularity and developer interest.",
  },
  {
    slug: "ai-developer-interest",
    name: "AI Developer Interest",
    symbol: "AI_DEV_INTEREST",
    description:
      "System entity representing aggregated global developer interest in AI.",
  },
] as const;

async function seedSources(): Promise<void> {
  await Promise.all(
    sources.map((source) =>
      prisma.source.upsert({
        where: {
          key: source.key,
        },
        update: {
          name: source.name,
          baseUrl: source.baseUrl,
          isActive: true,
        },
        create: {
          key: source.key,
          name: source.name,
          baseUrl: source.baseUrl,
          isActive: true,
        },
      }),
    ),
  );
}

async function seedEntities(): Promise<void> {
  await Promise.all(
    entities.map((entity) =>
      prisma.entity.upsert({
        where: {
          slug: entity.slug,
        },
        update: {
          name: entity.name,
          symbol: entity.symbol,
          description: entity.description,
        },
        create: {
          slug: entity.slug,
          name: entity.name,
          symbol: entity.symbol,
          description: entity.description,
        },
      }),
    ),
  );
}

async function seed(): Promise<void> {
  await Promise.all([seedSources(), seedEntities()]);
}

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
