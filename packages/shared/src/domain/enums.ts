export enum ForecastType {
  ShortTerm = "short_term",
  MediumTerm = "medium_term",
  LongTerm = "long_term",
}

export enum PredictionDirection {
  Up = "up",
  Down = "down",
  Neutral = "neutral",
}

export enum RiskLevel {
  Low = "low",
  Medium = "medium",
  High = "high",
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
}
