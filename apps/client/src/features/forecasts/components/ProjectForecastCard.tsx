import { Link } from "react-router-dom";

import { ProjectPopularityPrediction, RiskLevel } from "@ai-oracle/shared";

import type { ForecastEntity, ProjectForecastDto } from "@ai-oracle/shared";

import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

import "./ProjectForecastCard.css";

const predictionLabels: Record<ProjectPopularityPrediction, string> = {
  [ProjectPopularityPrediction.StrongRise]: "Сильный рост",
  [ProjectPopularityPrediction.Rise]: "Рост",
  [ProjectPopularityPrediction.Stable]: "Стабильно",
  [ProjectPopularityPrediction.Decline]: "Снижение",
  [ProjectPopularityPrediction.StrongDecline]: "Сильное снижение",
};

const riskLabels: Record<RiskLevel, string> = {
  [RiskLevel.Low]: "Низкий",
  [RiskLevel.Medium]: "Средний",
  [RiskLevel.High]: "Высокий",
};

const targetDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatTargetDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дата не определена";
  }

  return targetDateFormatter.format(date);
}

function formatFreshness(value: string): string {
  const createdAt = new Date(value);
  const createdAtTime = createdAt.getTime();

  if (Number.isNaN(createdAtTime)) {
    return "Время обновления неизвестно";
  }

  const elapsedMilliseconds = Math.max(0, Date.now() - createdAtTime);
  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60_000);

  if (elapsedMinutes < 1) {
    return "Обновлено только что";
  }

  if (elapsedMinutes < 60) {
    return `Обновлено ${elapsedMinutes} мин. назад`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `Обновлено ${elapsedHours} ч. назад`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  return `Обновлено ${elapsedDays} дн. назад`;
}

function formatConfidence(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

interface ProjectForecastCardProps {
  entity: ForecastEntity;
  forecast?: ProjectForecastDto;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  refreshing: boolean;
  refreshError: string | null;
  onRetry: () => void;
  onCreate: () => void;
}

export function ProjectForecastCard({
  entity,
  forecast,
  loading,
  error,
  notFound,
  refreshing,
  refreshError,
  onCreate,
  onRetry,
}: ProjectForecastCardProps) {
  return (
    <article className="project-card">
      <header className="project-card__header">
        <div>
          <p className="project-card__eyebrow">Project forecast</p>
          <h3>
            {" "}
            <Link
              className="project-card__title-link"
              to={`/forecasts/${entity.id}`}
            >
              {entity.name}
            </Link>
          </h3>
        </div>

        {entity.symbol !== null ? (
          <span className="project-card__symbol">{entity.symbol}</span>
        ) : null}
      </header>

      {loading && forecast === undefined ? (
        <div className="project-card__state" role="status" aria-live="polite">
          Загружаем прогноз…
        </div>
      ) : null}

      {error !== null && !notFound ? (
        <ErrorState
          compact
          title="Не удалось загрузить прогноз"
          description={`Прогноз для ${entity.name} не был загружен.`}
          details={error}
          action={
            <button type="button" disabled={loading} onClick={onRetry}>
              {loading ? "Повторяем…" : "Повторить"}
            </button>
          }
        />
      ) : null}

      {!loading && error === null && forecast === undefined ? (
        <>
          <EmptyState
            compact
            title="Текущий прогноз отсутствует"
            description={`Создайте первый прогноз популярности для ${entity.name}.`}
            action={
              <button type="button" disabled={refreshing} onClick={onCreate}>
                {refreshing ? "Создаём прогноз…" : "Создать прогноз"}
              </button>
            }
          />

          {refreshing ? (
            <div
              className="project-card__state"
              role="status"
              aria-live="polite"
            >
              Получаем свежие данные и создаём прогноз…
            </div>
          ) : null}

          {refreshError !== null ? (
            <ErrorState
              compact
              title="Не удалось создать прогноз"
              description="Initial forecast generation завершился ошибкой."
              details={refreshError}
              action={
                <button type="button" disabled={refreshing} onClick={onCreate}>
                  {refreshing ? "Создаём…" : "Повторить создание"}
                </button>
              }
            />
          ) : null}
        </>
      ) : null}

      {!loading && !notFound && error === null && forecast === undefined ? (
        <EmptyState
          compact
          title="Прогноз недоступен"
          description="Данные текущего прогноза отсутствуют."
        />
      ) : null}

      {forecast !== undefined && error === null ? (
        <>
          <div className="project-card__prediction">
            <span>Прогноз на 14 дней</span>
            <strong>{predictionLabels[forecast.prediction]}</strong>
          </div>

          <dl className="project-card__metrics">
            <div>
              <dt>Momentum score</dt>
              <dd>
                {forecast.score}
                <span>/100</span>
              </dd>
            </div>

            <div>
              <dt>Уверенность</dt>
              <dd>{formatConfidence(forecast.confidence)}</dd>
            </div>

            <div>
              <dt>Риск</dt>
              <dd>
                <span
                  className="project-card__risk"
                  data-risk={forecast.risk.toLowerCase()}
                >
                  {riskLabels[forecast.risk]}
                </span>
              </dd>
            </div>

            <div>
              <dt>Целевая дата</dt>
              <dd>
                <time dateTime={forecast.targetAt}>
                  {formatTargetDate(forecast.targetAt)}
                </time>
              </dd>
            </div>
          </dl>

          <footer className="project-card__footer">
            <time dateTime={forecast.createdAt}>
              {formatFreshness(forecast.createdAt)}
            </time>

            <Link
              className="project-card__details-link"
              to={`/forecasts/${entity.id}`}
              aria-label={`Открыть прогноз проекта ${entity.name}`}
            >
              Подробнее →
            </Link>
          </footer>
        </>
      ) : null}
    </article>
  );
}
