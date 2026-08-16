import {
  DeveloperInterestPrediction,
  ProjectPopularityPrediction,
} from "@ai-oracle/shared";

interface ScoreThreshold<TPrediction extends string> {
  readonly minimumScore: number;
  readonly prediction: TPrediction;
}

interface DeltaThreshold<TPrediction extends string> {
  readonly minimumDelta: number;
  readonly prediction: TPrediction;
}

export const PROJECT_POPULARITY_THRESHOLDS = [
  {
    minimumDelta: 10,
    prediction: ProjectPopularityPrediction.StrongRise,
  },
  {
    minimumDelta: 3,
    prediction: ProjectPopularityPrediction.Rise,
  },
  {
    minimumDelta: -3,
    prediction: ProjectPopularityPrediction.Stable,
  },
  {
    minimumDelta: -10,
    prediction: ProjectPopularityPrediction.Decline,
  },
  {
    minimumDelta: Number.NEGATIVE_INFINITY,
    prediction: ProjectPopularityPrediction.StrongDecline,
  },
] as const satisfies readonly DeltaThreshold<ProjectPopularityPrediction>[];

export const DEVELOPER_INTEREST_THRESHOLDS = [
  {
    minimumScore: 70,
    prediction: DeveloperInterestPrediction.High,
  },
  {
    minimumScore: 40,
    prediction: DeveloperInterestPrediction.Medium,
  },
  {
    minimumScore: 0,
    prediction: DeveloperInterestPrediction.Low,
  },
] as const satisfies readonly ScoreThreshold<DeveloperInterestPrediction>[];

export class InvalidForecastScoreError extends Error {
  constructor(readonly score: number) {
    super(`Forecast score must be between 0 and 100, received "${score}"`);

    this.name = "InvalidForecastScoreError";
  }
}

export function determineProjectPopularityPrediction(
  projectedDelta: number,
): ProjectPopularityPrediction {
  if (!Number.isFinite(projectedDelta)) {
    throw new InvalidForecastScoreError(projectedDelta);
  }

  const threshold = PROJECT_POPULARITY_THRESHOLDS.find(
    (item) => projectedDelta >= item.minimumDelta,
  );

  if (!threshold) {
    throw new Error(
      "Project popularity thresholds must include a lower boundary",
    );
  }

  return threshold.prediction;
}

export function determineDeveloperInterestPrediction(
  score: number,
): DeveloperInterestPrediction {
  return resolvePrediction(score, DEVELOPER_INTEREST_THRESHOLDS);
}

function resolvePrediction<TPrediction extends string>(
  score: number,
  thresholds: readonly ScoreThreshold<TPrediction>[],
): TPrediction {
  validateScore(score);

  const threshold = thresholds.find((item) => score >= item.minimumScore);

  if (!threshold) {
    throw new Error("Prediction thresholds must include a zero boundary");
  }

  return threshold.prediction;
}

function validateScore(score: number): void {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new InvalidForecastScoreError(score);
  }
}
