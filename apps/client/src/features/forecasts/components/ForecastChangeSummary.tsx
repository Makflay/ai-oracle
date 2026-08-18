import "./ForecastChangeSummary.css";

interface ForecastChangeSummaryProps {
  previousScore: number;
  currentScore: number;
  previousConfidence: number | null;
  currentConfidence: number | null;
  previousPrediction: string;
  currentPrediction: string;
}

function getChangeStatus(
  previousValue: number | string | null,
  currentValue: number | string | null,
): "increased" | "decreased" | "changed" | "unchanged" {
  if (previousValue === currentValue) {
    return "unchanged";
  }

  if (typeof previousValue === "number" && typeof currentValue === "number") {
    return currentValue > previousValue ? "increased" : "decreased";
  }

  return "changed";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatConfidence(value: number | null): string {
  return value === null ? "—" : `${formatNumber(value)}%`;
}

export function ForecastChangeSummary({
  previousScore,
  currentScore,
  previousConfidence,
  currentConfidence,
  previousPrediction,
  currentPrediction,
}: ForecastChangeSummaryProps) {
  return (
    <section
      className="forecast-change"
      aria-labelledby="forecast-change-title"
      aria-live="polite"
    >
      <header className="forecast-change__header">
        <div>
          <p className="forecast-change__eyebrow">Последнее обновление</p>
          <h2 id="forecast-change-title">Прогноз обновлён</h2>
        </div>

        <span className="forecast-change__freshness">Обновлено только что</span>
      </header>

      <dl className="forecast-change__items">
        <div data-change={getChangeStatus(previousScore, currentScore)}>
          <dt>Оценка / индекс</dt>
          <dd>
            <span>{formatNumber(previousScore)}</span>
            <span aria-hidden="true">→</span>
            <strong>{formatNumber(currentScore)}</strong>
          </dd>
        </div>

        <div
          data-change={getChangeStatus(previousConfidence, currentConfidence)}
        >
          <dt>Точность прогноза</dt>
          <dd>
            <span>{formatConfidence(previousConfidence)}</span>
            <span aria-hidden="true">→</span>
            <strong>{formatConfidence(currentConfidence)}</strong>
          </dd>
        </div>

        <div
          data-change={getChangeStatus(previousPrediction, currentPrediction)}
        >
          <dt>Прогноз</dt>
          <dd>
            <span>{previousPrediction}</span>
            <span aria-hidden="true">→</span>
            <strong>{currentPrediction}</strong>
          </dd>
        </div>
      </dl>
    </section>
  );
}
