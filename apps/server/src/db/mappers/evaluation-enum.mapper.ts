import { EvaluationStatus } from "@ai-oracle/shared";

import { EvaluationStatus as PrismaEvaluationStatus } from "../../generated/prisma/client.js";

const assertNever = (value: never, enumName: string): never => {
  throw new Error(`Unsupported ${enumName} value "${String(value)}"`);
};

export const toPrismaEvaluationStatus = (
  status: EvaluationStatus,
): PrismaEvaluationStatus => {
  switch (status) {
    case EvaluationStatus.Correct:
      return PrismaEvaluationStatus.CORRECT;

    case EvaluationStatus.Incorrect:
      return PrismaEvaluationStatus.INCORRECT;

    default:
      return assertNever(status, "EvaluationStatus");
  }
};

export const toDomainEvaluationStatus = (
  status: PrismaEvaluationStatus,
): EvaluationStatus => {
  switch (status) {
    case PrismaEvaluationStatus.CORRECT:
      return EvaluationStatus.Correct;

    case PrismaEvaluationStatus.INCORRECT:
      return EvaluationStatus.Incorrect;

    default:
      return assertNever(status, "Prisma EvaluationStatus");
  }
};
