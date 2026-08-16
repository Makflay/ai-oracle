import { MetricType } from "@ai-oracle/shared";

import { MetricType as PrismaMetricType } from "../../generated/prisma/client.js";

const assertNever = (value: never, enumName: string): never => {
  throw new Error(`Unsupported ${enumName} value "${String(value)}"`);
};

export const toPrismaMetricType = (type: MetricType): PrismaMetricType => {
  switch (type) {
    case MetricType.Price:
      return PrismaMetricType.PRICE;

    case MetricType.Volume:
      return PrismaMetricType.VOLUME;

    case MetricType.Volatility:
      return PrismaMetricType.VOLATILITY;

    case MetricType.Momentum:
      return PrismaMetricType.MOMENTUM;

    case MetricType.Sentiment:
      return PrismaMetricType.SENTIMENT;

    case MetricType.Downloads:
      return PrismaMetricType.DOWNLOADS;

    case MetricType.Likes:
      return PrismaMetricType.LIKES;

    case MetricType.Mentions:
      return PrismaMetricType.MENTIONS;

    case MetricType.Score:
      return PrismaMetricType.SCORE;

    case MetricType.Comments:
      return PrismaMetricType.COMMENTS;

    case MetricType.Engagement:
      return PrismaMetricType.ENGAGEMENT;

    case MetricType.Publications:
      return PrismaMetricType.PUBLICATIONS;

    default:
      return assertNever(type, "MetricType");
  }
};

export const toDomainMetricType = (type: PrismaMetricType): MetricType => {
  switch (type) {
    case PrismaMetricType.PRICE:
      return MetricType.Price;

    case PrismaMetricType.VOLUME:
      return MetricType.Volume;

    case PrismaMetricType.VOLATILITY:
      return MetricType.Volatility;

    case PrismaMetricType.MOMENTUM:
      return MetricType.Momentum;

    case PrismaMetricType.SENTIMENT:
      return MetricType.Sentiment;

    case PrismaMetricType.DOWNLOADS:
      return MetricType.Downloads;

    case PrismaMetricType.LIKES:
      return MetricType.Likes;

    case PrismaMetricType.MENTIONS:
      return MetricType.Mentions;

    case PrismaMetricType.SCORE:
      return MetricType.Score;

    case PrismaMetricType.COMMENTS:
      return MetricType.Comments;

    case PrismaMetricType.ENGAGEMENT:
      return MetricType.Engagement;

    case PrismaMetricType.PUBLICATIONS:
      return MetricType.Publications;

    default:
      return assertNever(type, "Prisma MetricType");
  }
};
