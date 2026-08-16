import {
  ForecastKind,
  ForecastStatus,
  ForecastType,
  PredictionDirection,
  RiskLevel,
} from "@ai-oracle/shared";

import {
  ForecastKind as PrismaForecastKind,
  ForecastStatus as PrismaForecastStatus,
  ForecastType as PrismaForecastType,
  PredictionDirection as PrismaPredictionDirection,
  RiskLevel as PrismaRiskLevel,
} from "../../generated/prisma/client.js";

const assertNever = (value: never, enumName: string): never => {
  throw new Error(`Unsupported ${enumName} value "${String(value)}"`);
};

export const toPrismaForecastType = (
  type: ForecastType,
): PrismaForecastType => {
  switch (type) {
    case ForecastType.ShortTerm:
      return PrismaForecastType.SHORT_TERM;

    case ForecastType.MediumTerm:
      return PrismaForecastType.MEDIUM_TERM;

    case ForecastType.LongTerm:
      return PrismaForecastType.LONG_TERM;

    default:
      return assertNever(type, "ForecastType");
  }
};

export const toDomainForecastType = (
  type: PrismaForecastType,
): ForecastType => {
  switch (type) {
    case PrismaForecastType.SHORT_TERM:
      return ForecastType.ShortTerm;

    case PrismaForecastType.MEDIUM_TERM:
      return ForecastType.MediumTerm;

    case PrismaForecastType.LONG_TERM:
      return ForecastType.LongTerm;

    default:
      return assertNever(type, "Prisma ForecastType");
  }
};

export const toPrismaForecastKind = (
  kind: ForecastKind,
): PrismaForecastKind => {
  switch (kind) {
    case ForecastKind.ProjectPopularity:
      return PrismaForecastKind.PROJECT_POPULARITY;

    case ForecastKind.DeveloperInterest:
      return PrismaForecastKind.DEVELOPER_INTEREST;

    default:
      return assertNever(kind, "ForecastKind");
  }
};

export const toDomainForecastKind = (
  kind: PrismaForecastKind,
): ForecastKind => {
  switch (kind) {
    case PrismaForecastKind.PROJECT_POPULARITY:
      return ForecastKind.ProjectPopularity;

    case PrismaForecastKind.DEVELOPER_INTEREST:
      return ForecastKind.DeveloperInterest;

    default:
      return assertNever(kind, "Prisma ForecastKind");
  }
};

export const toPrismaForecastStatus = (
  status: ForecastStatus,
): PrismaForecastStatus => {
  switch (status) {
    case ForecastStatus.Pending:
      return PrismaForecastStatus.PENDING;

    case ForecastStatus.Running:
      return PrismaForecastStatus.RUNNING;

    case ForecastStatus.Completed:
      return PrismaForecastStatus.COMPLETED;

    case ForecastStatus.Failed:
      return PrismaForecastStatus.FAILED;

    default:
      return assertNever(status, "ForecastStatus");
  }
};

export const toDomainForecastStatus = (
  status: PrismaForecastStatus,
): ForecastStatus => {
  switch (status) {
    case PrismaForecastStatus.PENDING:
      return ForecastStatus.Pending;

    case PrismaForecastStatus.RUNNING:
      return ForecastStatus.Running;

    case PrismaForecastStatus.COMPLETED:
      return ForecastStatus.Completed;

    case PrismaForecastStatus.FAILED:
      return ForecastStatus.Failed;

    default:
      return assertNever(status, "Prisma ForecastStatus");
  }
};

export const toPrismaRiskLevel = (risk: RiskLevel): PrismaRiskLevel => {
  switch (risk) {
    case RiskLevel.Low:
      return PrismaRiskLevel.LOW;

    case RiskLevel.Medium:
      return PrismaRiskLevel.MEDIUM;

    case RiskLevel.High:
      return PrismaRiskLevel.HIGH;

    default:
      return assertNever(risk, "RiskLevel");
  }
};

export const toDomainRiskLevel = (risk: PrismaRiskLevel): RiskLevel => {
  switch (risk) {
    case PrismaRiskLevel.LOW:
      return RiskLevel.Low;

    case PrismaRiskLevel.MEDIUM:
      return RiskLevel.Medium;

    case PrismaRiskLevel.HIGH:
      return RiskLevel.High;

    default:
      return assertNever(risk, "Prisma RiskLevel");
  }
};

export const toPrismaPredictionDirection = (
  direction: PredictionDirection,
): PrismaPredictionDirection => {
  switch (direction) {
    case PredictionDirection.Up:
      return PrismaPredictionDirection.UP;

    case PredictionDirection.Down:
      return PrismaPredictionDirection.DOWN;

    case PredictionDirection.Neutral:
      return PrismaPredictionDirection.NEUTRAL;

    default:
      return assertNever(direction, "PredictionDirection");
  }
};

export const toDomainPredictionDirection = (
  direction: PrismaPredictionDirection,
): PredictionDirection => {
  switch (direction) {
    case PrismaPredictionDirection.UP:
      return PredictionDirection.Up;

    case PrismaPredictionDirection.DOWN:
      return PredictionDirection.Down;

    case PrismaPredictionDirection.NEUTRAL:
      return PredictionDirection.Neutral;

    default:
      return assertNever(direction, "Prisma PredictionDirection");
  }
};
