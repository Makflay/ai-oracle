import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ProjectPopularityPrediction, RiskLevel } from "@ai-oracle/shared";

import type { ProjectForecastDto } from "@ai-oracle/shared";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchEntities } from "../features/entities/entitiesSlice";
import {
  fetchProjectForecast,
  refreshProjectForecast,
} from "../features/forecasts/forecastSlice";

import { FactorBreakdown } from "../features/forecasts/components/FactorBreakdown";
import { SourceDataFreshness } from "../features/forecasts/components/SourceDataFreshness";
import { RiskExplanation } from "../features/forecasts/components/RiskExplanation";
import { ForecastChangeSummary } from "../features/forecasts/components/ForecastChangeSummary";
import { ForecastOutcome } from "../features/forecasts/components/ForecastOutcome";

import "./ForecastPage.css";

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

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дата не определена";
  }

  return dateFormatter.format(date);
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

function formatIndex(value: number | null): string {
  return value === null ? "—" : `${value}/100`;
}

function formatConfidence(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

interface ForecastDetailsProps {
  forecast: ProjectForecastDto;
}

function ForecastDetails({ forecast }: ForecastDetailsProps) {
  const dispatch = useAppDispatch();
  const [previousForecast, setPreviousForecast] =
    useState<ProjectForecastDto | null>(null);

  return (
    <>
      <div className="forecast-details__overview">
        <div>
          <p className="forecast-details__label">Текущий score</p>
          <p className="forecast-details__score">{forecast.score}</p>
          <p className="forecast-details__scale">из 100</p>
        </div>

        <div>
          <p className="forecast-details__label">Прогноз на 14 дней</p>
          <p className="forecast-details__prediction">
            {predictionLabels[forecast.prediction]}
          </p>
          <p className="forecast-details__summary">{forecast.summary}</p>
        </div>
      </div>

      <dl className="forecast-details__metrics">
        <div>
          <dt>Прогнозируемое значение</dt>
          <dd>{formatIndex(forecast.predictedValue)}</dd>
        </div>

        <div>
          <dt>Уверенность</dt>
          <dd>{formatConfidence(forecast.confidence)}</dd>
        </div>

        <div>
          <dt>Риск</dt>
          <dd>
            <span
              className="forecast-details__risk"
              data-risk={forecast.risk.toLowerCase()}
            >
              {riskLabels[forecast.risk]}
            </span>
          </dd>
        </div>

        <div>
          <dt>Создан</dt>
          <dd>
            <time dateTime={forecast.createdAt}>
              {formatDate(forecast.createdAt)}
            </time>
          </dd>
        </div>

        <div>
          <dt>Целевая дата</dt>
          <dd>
            <time dateTime={forecast.targetAt}>
              {formatDate(forecast.targetAt)}
            </time>
          </dd>
        </div>

        <div>
          <dt>Актуальность</dt>
          <dd>
            <time dateTime={forecast.createdAt}>
              {formatFreshness(forecast.createdAt)}
            </time>
          </dd>
        </div>
      </dl>
    </>
  );
}

export function ForecastPage() {
  const dispatch = useAppDispatch();
  const [previousForecast, setPreviousForecast] =
    useState<ProjectForecastDto | null>(null);

  const { id: entityId } = useParams<{ id: string }>();
  const {
    items: entities,
    loading: entitiesLoading,
    error: entitiesError,
  } = useAppSelector((state) => state.entities);

  const forecast = useAppSelector((state) =>
    entityId === undefined
      ? undefined
      : state.forecasts.projectForecasts[entityId],
  );

  const forecastLoading = useAppSelector((state) =>
    entityId === undefined
      ? false
      : (state.forecasts.projectLoading[entityId] ?? false),
  );

  const forecastError = useAppSelector((state) =>
    entityId === undefined
      ? null
      : (state.forecasts.projectErrors[entityId] ?? null),
  );

  const forecastNotFound = useAppSelector((state) =>
    entityId === undefined
      ? false
      : (state.forecasts.projectNotFound[entityId] ?? false),
  );

  const forecastRefreshing = useAppSelector((state) =>
    entityId === undefined
      ? false
      : (state.forecasts.projectRefreshing[entityId] ?? false),
  );

  const forecastRefreshError = useAppSelector((state) =>
    entityId === undefined
      ? null
      : (state.forecasts.projectRefreshErrors[entityId] ?? null),
  );

  const entity = entities.find((item) => item.id === entityId);

  useEffect(() => {
    if (entities.length === 0 && !entitiesLoading && entitiesError === null) {
      void dispatch(fetchEntities());
    }
  }, [dispatch, entities.length, entitiesError, entitiesLoading]);

  useEffect(() => {
    if (
      entityId !== undefined &&
      forecast === undefined &&
      !forecastLoading &&
      forecastError === null &&
      !forecastNotFound
    ) {
      void dispatch(fetchProjectForecast(entityId));
    }
  }, [
    dispatch,
    entityId,
    forecast,
    forecastError,
    forecastLoading,
    forecastNotFound,
  ]);

  const entitiesPending =
    entities.length === 0 && !entitiesLoading && entitiesError === null;

  const handleRefresh = async (): Promise<void> => {
    if (
      entityId === undefined ||
      forecast === undefined ||
      forecastRefreshing
    ) {
      return;
    }

    const previous = forecast;

    setPreviousForecast(null);

    try {
      const result = await dispatch(refreshProjectForecast(entityId)).unwrap();

      if (result.refreshed) {
        setPreviousForecast(previous);
      }
    } catch {
      // Refresh error is already stored and rendered by the Redux slice.
    }
  };

  if (entityId === undefined) {
    return (
      <section className="forecast-page-state">
        <p className="page__eyebrow">Not found</p>
        <h1>Прогноз не найден</h1>
        <p>В адресе страницы отсутствует идентификатор проекта.</p>
        <Link className="text-link" to="/">
          Вернуться к прогнозам
        </Link>
      </section>
    );
  }

  if (entitiesError !== null) {
    return (
      <section className="forecast-page-state" role="alert">
        <p className="page__eyebrow">Ошибка</p>
        <h1>Не удалось загрузить проект</h1>
        <p>{entitiesError}</p>
        <Link className="text-link" to="/">
          Вернуться к прогнозам
        </Link>
      </section>
    );
  }

  if (
    forecastNotFound ||
    (!entitiesLoading && entities.length > 0 && entity === undefined)
  ) {
    return (
      <section className="forecast-page-state">
        <p className="page__eyebrow">404</p>
        <h1>Прогноз не найден</h1>
        <p>Проект или его текущий прогноз не существует.</p>
        <Link className="text-link" to="/">
          Вернуться к прогнозам
        </Link>
      </section>
    );
  }

  if (forecastError !== null) {
    return (
      <section className="forecast-page-state" role="alert">
        <p className="page__eyebrow">Ошибка</p>
        <h1>Не удалось загрузить прогноз</h1>
        <p>{forecastError}</p>
        <Link className="text-link" to="/">
          Вернуться к прогнозам
        </Link>
      </section>
    );
  }

  if (
    entitiesLoading ||
    entitiesPending ||
    forecastLoading ||
    forecast === undefined ||
    entity === undefined
  ) {
    return (
      <section className="forecast-page-state" role="status" aria-busy="true">
        <p className="page__eyebrow">Project forecast</p>
        <h1>Загружаем прогноз…</h1>
      </section>
    );
  }

  return (
    <article className="forecast-details">
      <header className="forecast-details__header">
        <div>
          <p className="page__eyebrow">Project forecast</p>
          <h1>{entity.name}</h1>
          {entity.description !== null ? <p>{entity.description}</p> : null}
        </div>

        <div className="forecast-details__actions">
          {entity.symbol !== null ? (
            <span className="forecast-details__symbol">{entity.symbol}</span>
          ) : null}

          <button
            className="forecast-details__refresh"
            type="button"
            disabled={forecastRefreshing}
            onClick={() => {
              handleRefresh();
            }}
          >
            Refresh forecast
          </button>
        </div>
      </header>

      {forecastRefreshing ? (
        <div
          className="forecast-details__updating"
          role="status"
          aria-live="polite"
        >
          Updating fresh data...
        </div>
      ) : null}

      {forecastRefreshError !== null ? (
        <div className="forecast-details__refresh-error" role="alert">
          {forecastRefreshError}
        </div>
      ) : null}

      {previousForecast !== null ? (
        <ForecastChangeSummary
          previousScore={previousForecast.score}
          currentScore={forecast.score}
          previousConfidence={previousForecast.confidence}
          currentConfidence={forecast.confidence}
          previousPrediction={predictionLabels[previousForecast.prediction]}
          currentPrediction={predictionLabels[forecast.prediction]}
        />
      ) : null}

      <ForecastDetails forecast={forecast} />

      <ForecastOutcome outcome={forecast.outcome} />

      <RiskExplanation risk={forecast.risk} reason={forecast.riskReason} />

      <SourceDataFreshness sourceData={forecast.sourceData} />

      <FactorBreakdown factors={forecast.factors} />

      <footer className="forecast-details__footer">
        <Link className="text-link" to="/">
          ← Вернуться к прогнозам
        </Link>
      </footer>
    </article>
  );
}
