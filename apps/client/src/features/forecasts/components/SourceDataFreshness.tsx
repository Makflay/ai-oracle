import { SourceDataFreshnessStatus } from "@ai-oracle/shared";

import type { ProjectForecastSourceDataDto } from "@ai-oracle/shared";

import { EmptyState } from "../components/EmptyState";

import "./SourceDataFreshness.css";

const sourceLabels: Readonly<Record<string, string>> = {
  hugging_face: "Hugging Face",
  hacker_news: "Hacker News",
  arxiv: "arXiv",
};

const sourceOrder: Readonly<Record<string, number>> = {
  hugging_face: 0,
  hacker_news: 1,
  arxiv: 2,
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const freshnessLabels: Record<SourceDataFreshnessStatus, string> = {
  [SourceDataFreshnessStatus.Fresh]: "АКТУАЛЬНЫЙ",
  [SourceDataFreshnessStatus.Stale]: "УСТАРЕВШИЙ",
};

function formatSourceName(sourceKey: string): string {
  return (
    sourceLabels[sourceKey] ??
    sourceKey
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function formatFetchedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дата не определена";
  }

  return dateFormatter.format(date);
}

function formatRelativeFreshness(value: string): string {
  const fetchedAt = new Date(value);
  const fetchedAtTime = fetchedAt.getTime();

  if (Number.isNaN(fetchedAtTime)) {
    return "Возраст данных неизвестен";
  }

  const elapsedMilliseconds = Math.max(0, Date.now() - fetchedAtTime);
  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60_000);

  if (elapsedMinutes < 1) {
    return "Получено только что";
  }

  if (elapsedMinutes < 60) {
    return `Получено ${elapsedMinutes} мин. назад`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `Получено ${elapsedHours} ч. назад`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  return `Получено ${elapsedDays} дн. назад`;
}

function orderSourceData(
  sourceData: readonly ProjectForecastSourceDataDto[],
): ProjectForecastSourceDataDto[] {
  return [...sourceData].sort((left, right) => {
    const leftPosition = sourceOrder[left.sourceKey] ?? Number.MAX_SAFE_INTEGER;
    const rightPosition =
      sourceOrder[right.sourceKey] ?? Number.MAX_SAFE_INTEGER;

    if (leftPosition !== rightPosition) {
      return leftPosition - rightPosition;
    }

    return left.sourceKey.localeCompare(right.sourceKey);
  });
}

interface SourceDataFreshnessProps {
  sourceData: readonly ProjectForecastSourceDataDto[];
}

export function SourceDataFreshness({ sourceData }: SourceDataFreshnessProps) {
  const orderedSourceData = orderSourceData(sourceData);

  return (
    <section
      className="source-freshness"
      aria-labelledby="source-freshness-title"
    >
      <header className="source-freshness__header">
        <div>
          <p className="source-freshness__eyebrow">Исходные данные</p>
          <h2 id="source-freshness-title">Актуальность данных</h2>
        </div>

        <p>
          Актуальность исходных данных, фактически использованных при построении
          прогноза.
        </p>
      </header>

      {orderedSourceData.length === 0 ? (
        <EmptyState
          compact
          title="Данные об источниках отсутствуют"
          description="Сервер не вернул сведения о свежести исходных данных. Попробуйте обновить прогноз."
        />
      ) : (
        <div className="source-freshness__grid">
          {orderedSourceData.map((source) => (
            <article className="source-freshness__item" key={source.sourceKey}>
              <header className="source-freshness__item-header">
                <h3>{formatSourceName(source.sourceKey)}</h3>

                <span
                  className="source-freshness__status"
                  data-status={source.freshnessStatus.toLowerCase()}
                >
                  {freshnessLabels[source.freshnessStatus]}
                </span>
              </header>

              <dl className="source-freshness__details">
                <div>
                  <dt>Получено</dt>
                  <dd>
                    <time dateTime={source.fetchedAt}>
                      {formatFetchedAt(source.fetchedAt)}
                    </time>
                  </dd>
                </div>

                <div>
                  <dt>Относительная свежесть</dt>
                  <dd>{formatRelativeFreshness(source.fetchedAt)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
