import { useState } from "react";
import { DeveloperInterestPrediction, RiskLevel } from "@ai-oracle/shared";
import type { DeveloperInterestForecastDto } from "@ai-oracle/shared";

import { useAppSelector, useAppDispatch } from "../../../app/hooks";
import {
  refreshDeveloperInterestForecast,
  fetchDeveloperInterestForecast,
} from "../forecastSlice";

import { ForecastChangeSummary } from "./ForecastChangeSummary";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

import "./DeveloperInterestHeroCard.css";

const predictionLabels: Record<DeveloperInterestPrediction, string> = {
  [DeveloperInterestPrediction.High]: "Высокий интерес",
  [DeveloperInterestPrediction.Medium]: "Умеренный интерес",
  [DeveloperInterestPrediction.Low]: "Низкий интерес",
};

const riskLabels: Record<RiskLevel, string> = {
  [RiskLevel.Low]: "Низкий",
  [RiskLevel.Medium]: "Средний",
  [RiskLevel.High]: "Высокий",
};

const targetDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
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

function formatPercentage(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function formatIndex(value: number | null): string {
  return value === null ? "—" : `${value}/100`;
}

interface HeroContentProps {
  forecast: DeveloperInterestForecastDto;
}

function HeroContent({ forecast }: HeroContentProps) {
  return (
    <>
      <div className="developer-hero__main">
        <div>
          <p className="developer-hero__label">Текущий индекс</p>
          <p className="developer-hero__index">{forecast.score}</p>
          <p className="developer-hero__scale">из 100</p>
        </div>

        <div className="developer-hero__prediction">
          <p className="developer-hero__label">Прогноз на 14 дней</p>
          <p className="developer-hero__prediction-value">
            {predictionLabels[forecast.prediction]}
          </p>
          <p className="developer-hero__summary">{forecast.summary}</p>
        </div>
      </div>

      <dl className="developer-hero__metrics">
        <div>
          <dt>Прогнозируемое значение</dt>
          <dd>{formatIndex(forecast.predictedValue)}</dd>
        </div>

        <div>
          <dt>Уверенность</dt>
          <dd>{formatPercentage(forecast.confidence)}</dd>
        </div>

        <div>
          <dt>Риск</dt>
          <dd>
            <span
              className="developer-hero__risk"
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

      <footer className="developer-hero__footer">
        <time dateTime={forecast.createdAt}>
          {formatFreshness(forecast.createdAt)}
        </time>
      </footer>
    </>
  );
}

export function DeveloperInterestHeroCard() {
  const dispatch = useAppDispatch();
  const {
    developerInterest,
    developerInterestLoading,
    developerInterestError,
    developerInterestRefreshing,
    developerInterestRefreshError,
    developerInterestNotFound,
  } = useAppSelector((state) => state.forecasts);

  const [previousForecast, setPreviousForecast] =
    useState<DeveloperInterestForecastDto | null>(null);

  const handleRefresh = async (): Promise<void> => {
    if (developerInterestRefreshing || developerInterest === null) {
      return;
    }

    const previous = developerInterest;

    setPreviousForecast(null);

    try {
      const result = await dispatch(
        refreshDeveloperInterestForecast(),
      ).unwrap();

      if (result.refreshed) {
        setPreviousForecast(previous);
      }
    } catch {
      // The error is handled through Redux state.
    }
  };

  const handleCreate = async (): Promise<void> => {
    if (developerInterestRefreshing || developerInterest !== null) {
      return;
    }

    try {
      await dispatch(refreshDeveloperInterestForecast()).unwrap();
    } catch {
      // The error is handled through Redux state.
    }
  };

  if (developerInterestLoading && developerInterest === null) {
    return (
      <section
        className="developer-hero"
        aria-busy="true"
        aria-labelledby="developer-interest-title"
      >
        <header className="developer-hero__header">
          <p>Global forecast</p>
          <h2 id="developer-interest-title">AI Developer Interest</h2>
        </header>

        <div className="developer-hero__state" role="status">
          Загружаем глобальный прогноз…
        </div>
      </section>
    );
  }

  if (developerInterestNotFound && developerInterest === null) {
    return (
      <section
        className="developer-hero"
        aria-labelledby="developer-interest-title"
        aria-busy={developerInterestRefreshing}
      >
        <header className="developer-hero__header">
          <p>Global forecast</p>
          <h2 id="developer-interest-title">AI Developer Interest</h2>
        </header>

        <EmptyState
          title="Глобальный прогноз ещё не создан"
          description="Создайте первый Developer Interest forecast на основе актуальных данных Hugging Face, Hacker News и arXiv."
          action={
            <button
              type="button"
              disabled={developerInterestRefreshing}
              onClick={() => {
                void handleCreate();
              }}
            >
              {developerInterestRefreshing
                ? "Создаём прогноз…"
                : "Создать прогноз"}
            </button>
          }
        />

        {developerInterestRefreshing ? (
          <div
            className="developer-hero__updating"
            role="status"
            aria-live="polite"
          >
            Получаем исходные данные и создаём прогноз…
          </div>
        ) : null}

        {developerInterestRefreshError !== null ? (
          <ErrorState
            compact
            title="Не удалось создать прогноз"
            description="Initial forecast generation завершился ошибкой. Можно повторить запрос."
            details={developerInterestRefreshError}
            action={
              <button
                type="button"
                disabled={developerInterestRefreshing}
                onClick={() => {
                  void handleCreate();
                }}
              >
                {developerInterestRefreshing
                  ? "Создаём…"
                  : "Повторить создание"}
              </button>
            }
          />
        ) : null}
      </section>
    );
  }

  if (
    developerInterestError !== null &&
    !developerInterestNotFound &&
    developerInterest === null
  ) {
    return (
      <section
        className="developer-hero"
        aria-labelledby="developer-interest-title"
      >
        <header className="developer-hero__header">
          <p>Global forecast</p>
          <h2 id="developer-interest-title">AI Developer Interest</h2>
        </header>

        <ErrorState
          title="Не удалось загрузить глобальный прогноз"
          description="Developer Interest временно недоступен. Остальные разделы страницы продолжают работать."
          details={developerInterestError}
          action={
            <button
              type="button"
              disabled={developerInterestLoading}
              onClick={() => {
                void dispatch(fetchDeveloperInterestForecast());
              }}
            >
              {developerInterestLoading ? "Повторяем…" : "Повторить"}
            </button>
          }
        />
      </section>
    );
  }

  if (developerInterest === null) {
    return (
      <section
        className="developer-hero"
        aria-labelledby="developer-interest-title"
      >
        <header className="developer-hero__header">
          <p>Global forecast</p>
          <h2 id="developer-interest-title">AI Developer Interest</h2>
        </header>

        <EmptyState
          title="Глобальный прогноз ещё не создан"
          description="Текущий Developer Interest forecast отсутствует. Проверьте историю предыдущих прогнозов или вернитесь позже."
          action={
            <button
              type="button"
              disabled={developerInterestRefreshing}
              onClick={() => {
                void handleCreate();
              }}
            >
              {developerInterestRefreshing
                ? "Создаём прогноз…"
                : "Создать прогноз"}
            </button>
          }
        />
      </section>
    );
  }

  return (
    <section
      className="developer-hero"
      aria-labelledby="developer-interest-title"
    >
      <header className="developer-hero__header">
        <div>
          <p>Global forecast</p>
          <h2 id="developer-interest-title">AI Developer Interest</h2>
        </div>

        <button
          className="developer-hero__refresh"
          type="button"
          disabled={developerInterestRefreshing}
          onClick={() => {
            void handleRefresh();
          }}
        >
          Refresh forecast
        </button>
      </header>

      {developerInterestRefreshing ? (
        <div
          className="developer-hero__updating"
          role="status"
          aria-live="polite"
        >
          Updating fresh data...
        </div>
      ) : null}

      {developerInterestRefreshError !== null ? (
        <ErrorState
          compact
          title="Не удалось обновить прогноз"
          description="Текущий прогноз сохранён на экране. Можно повторить обновление."
          details={developerInterestRefreshError}
          action={
            <button
              type="button"
              disabled={developerInterestRefreshing}
              onClick={() => {
                void handleRefresh();
              }}
            >
              {developerInterestRefreshing ? "Обновляем…" : "Повторить refresh"}
            </button>
          }
        />
      ) : null}

      {previousForecast !== null ? (
        <ForecastChangeSummary
          previousScore={previousForecast.score}
          currentScore={developerInterest.score}
          previousConfidence={previousForecast.confidence}
          currentConfidence={developerInterest.confidence}
          previousPrediction={predictionLabels[previousForecast.prediction]}
          currentPrediction={predictionLabels[developerInterest.prediction]}
        />
      ) : null}

      <HeroContent forecast={developerInterest} />
    </section>
  );
}
