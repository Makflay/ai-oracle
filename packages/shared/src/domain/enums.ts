export enum ForecastType {
  ShortTerm = "short_term",
  MediumTerm = "medium_term",
  LongTerm = "long_term",
}

export enum ForecastKind {
  ProjectPopularity = "PROJECT_POPULARITY",
  DeveloperInterest = "DEVELOPER_INTEREST",
}

export enum PredictionDirection {
  Up = "up",
  Down = "down",
  Neutral = "neutral",
}

export enum RiskLevel {
  Low = "LOW",
  Medium = "MEDIUM",
  High = "HIGH",
}

export enum ForecastStatus {
  Pending = "pending",
  Running = "running",
  Completed = "completed",
  Failed = "failed",
}

export enum MetricType {
  Price = "price",
  Volume = "volume",
  Volatility = "volatility",
  Momentum = "momentum",
  Sentiment = "sentiment",

  Downloads = "downloads",
  Likes = "likes",
  Mentions = "mentions",
  Score = "score",
  Comments = "comments",
  Engagement = "engagement",
  Publications = "publications",
}

export enum ProjectPopularityPrediction {
  StrongRise = "STRONG_RISE",
  Rise = "RISE",
  Stable = "STABLE",
  Decline = "DECLINE",
  StrongDecline = "STRONG_DECLINE",
}

export enum DeveloperInterestPrediction {
  High = "HIGH",
  Medium = "MEDIUM",
  Low = "LOW",
}

export enum EvaluationStatus {
  Correct = "CORRECT",
  Incorrect = "INCORRECT",
}
