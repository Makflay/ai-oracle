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

async function seed(): Promise<void> {
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

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
