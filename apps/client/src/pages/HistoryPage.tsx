import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import {
  DeveloperInterestPrediction,
  ForecastKind,
  ForecastStatus,
  ProjectPopularityPrediction,
  ForecastType,
} from "@ai-oracle/shared";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchEntities } from "../features/entities/entitiesSlice";
import {
  fetchForecastHistory,
  resetHistoryFilters,
  setHistoryEntityId,
  setHistoryForecastType,
  setHistoryStatus,
} from "../features/history/historySlice";
import { ForecastOutcome } from "../features/forecasts/components/ForecastOutcome";
import { EmptyState } from "../features/forecasts/components/EmptyState";

import "./HistoryPage.css";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const predictionLabels: Readonly<Record<string, string>> = {
  [ProjectPopularityPrediction.StrongRise]: "Сильный рост",
  [ProjectPopularityPrediction.Rise]: "Рост",
  [ProjectPopularityPrediction.Stable]: "Стабильно",
  [ProjectPopularityPrediction.Decline]: "Снижение",
  [ProjectPopularityPrediction.StrongDecline]: "Сильное снижение",
  [DeveloperInterestPrediction.High]: "Высокий интерес",
  [DeveloperInterestPrediction.Medium]: "Умеренный интерес",
  [DeveloperInterestPrediction.Low]: "Низкий интерес",
};

const forecastTypeLabels: Record<ForecastType, string> = {
  [ForecastType.ShortTerm]: "Short term",
  [ForecastType.MediumTerm]: "Medium term",
  [ForecastType.LongTerm]: "Long term",
};

const statusLabels: Record<ForecastStatus, string> = {
  [ForecastStatus.Pending]: "Pending",
  [ForecastStatus.Running]: "Running",
  [ForecastStatus.Completed]: "Completed",
  [ForecastStatus.Failed]: "Failed",
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дата не определена";
  }

  return dateFormatter.format(date);
}

function formatConfidence(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function formatPrediction(value: string): string {
  return predictionLabels[value] ?? value;
}

function parseForecastType(value: string): ForecastType | null {
  return (
    Object.values(ForecastType).find(
      (forecastType) => forecastType === value,
    ) ?? null
  );
}

function parseForecastStatus(value: string): ForecastStatus | null {
  return (
    Object.values(ForecastStatus).find((status) => status === value) ?? null
  );
}

export function HistoryPage() {
  const dispatch = useAppDispatch();
  const historyRequested = useRef(false);
  const entitiesRequested = useRef(false);

  const {
    items: history,
    loading: historyLoading,
    error: historyError,
    filters,
  } = useAppSelector((state) => state.history);

  const entities = useAppSelector((state) => state.entities.items);

  useEffect(() => {
    if (!historyRequested.current) {
      historyRequested.current = true;
      void dispatch(fetchForecastHistory());
    }
  }, [dispatch]);

  useEffect(() => {
    if (entities.length === 0 && !entitiesRequested.current) {
      entitiesRequested.current = true;
      void dispatch(fetchEntities());
    }
  }, [dispatch, entities.length]);

  function reloadHistory(): void {
    void dispatch(fetchForecastHistory());
  }

  function handleForecastTypeChange(value: string): void {
    dispatch(setHistoryForecastType(parseForecastType(value)));
    reloadHistory();
  }

  function handleStatusChange(value: string): void {
    dispatch(setHistoryStatus(parseForecastStatus(value)));
    reloadHistory();
  }

  function handleEntityChange(value: string): void {
    dispatch(setHistoryEntityId(value || null));
    reloadHistory();
  }

  function handleResetFilters(): void {
    dispatch(resetHistoryFilters());
    reloadHistory();
  }

  const entityNames = new Map(
    entities.map((entity) => [entity.id, entity.name]),
  );

  const hasActiveFilters =
    filters.entityId !== null ||
    filters.forecastType !== null ||
    filters.status !== null;

  const initialLoading =
    (!historyRequested.current || historyLoading) && history.length === 0;

  return (
    <section className="history-page">
      <header className="history-page__header">
        <div>
          <p className="page__eyebrow">Forecast archive</p>
          <h1>История прогнозов</h1>
        </div>

        <p>
          Сохранённые прогнозы AI-проектов и глобального Developer Interest.
        </p>
      </header>

      <div className="history-filters" aria-label="Фильтры истории прогнозов">
        <label className="history-filter">
          <span>Forecast Type</span>

          <select
            value={filters.forecastType ?? ""}
            onChange={(event) => handleForecastTypeChange(event.target.value)}
          >
            <option value="">All forecast types</option>

            {Object.values(ForecastType).map((forecastType) => (
              <option key={forecastType} value={forecastType}>
                {forecastTypeLabels[forecastType]}
              </option>
            ))}
          </select>
        </label>

        <label className="history-filter">
          <span>Status</span>

          <select
            value={filters.status ?? ""}
            onChange={(event) => handleStatusChange(event.target.value)}
          >
            <option value="">All statuses</option>

            {Object.values(ForecastStatus).map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="history-filter">
          <span>Entity</span>

          <select
            value={filters.entityId ?? ""}
            onChange={(event) => handleEntityChange(event.target.value)}
          >
            <option value="">All entities</option>

            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
        </label>

        <button
          className="history-filters__reset"
          type="button"
          onClick={handleResetFilters}
          disabled={!hasActiveFilters}
        >
          Reset filters
        </button>
      </div>

      {initialLoading ? (
        <div className="history-page__state" role="status" aria-busy="true">
          Загружаем историю прогнозов…
        </div>
      ) : null}

      {historyError !== null ? (
        <div
          className="history-page__state history-page__state--error"
          role="alert"
        >
          {historyError}
        </div>
      ) : null}

      {!historyLoading &&
      historyError === null &&
      historyRequested.current &&
      history.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Прогнозы не найдены"
            description="В истории нет прогнозов, соответствующих выбранным фильтрам."
            action={
              <button type="button" onClick={handleResetFilters}>
                Сбросить фильтры
              </button>
            }
          />
        ) : (
          <EmptyState
            title="История пока пуста"
            description="Сохранённые прогнозы появятся здесь после первого запуска forecast pipeline."
          />
        )
      ) : null}

      {history.length > 0 ? (
        <>
          {historyLoading ? (
            <div
              className="history-page__updating"
              role="status"
              aria-live="polite"
            >
              Обновляем историю…
            </div>
          ) : null}

          <div className="history-table-container" aria-busy={historyLoading}>
            <table className="history-table">
              <thead>
                <tr>
                  <th scope="col">Created</th>
                  <th scope="col">Entity</th>
                  <th scope="col">Prediction</th>
                  <th scope="col">Score</th>
                  <th scope="col">Confidence</th>
                  <th scope="col">Target</th>
                  <th scope="col">Forecast Status</th>
                  <th scope="col">Outcome</th>
                  <th scope="col">
                    <span className="history-table__action-label">
                      Действие
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => {
                  const entityName =
                    entityNames.get(item.entityId) ?? item.entityId;

                  const hasDetailsPage =
                    item.forecastKind === ForecastKind.ProjectPopularity;

                  return (
                    <tr key={item.id}>
                      <td>
                        <time dateTime={item.createdAt}>
                          {formatDate(item.createdAt)}
                        </time>
                      </td>

                      <th scope="row">
                        {hasDetailsPage ? (
                          <Link
                            className="history-table__entity-link"
                            to={`/forecasts/${item.entityId}`}
                          >
                            {entityName}
                          </Link>
                        ) : (
                          <span>{entityName}</span>
                        )}
                      </th>

                      <td>{formatPrediction(item.prediction)}</td>

                      <td className="history-table__number">{item.score}</td>

                      <td className="history-table__number">
                        {formatConfidence(item.confidence)}
                      </td>

                      <td>
                        <time dateTime={item.targetAt}>
                          {formatDate(item.targetAt)}
                        </time>
                      </td>

                      <td>
                        <span
                          className="history-table__status"
                          data-status={item.status}
                        >
                          {statusLabels[item.status]}
                        </span>
                      </td>

                      <td>
                        <ForecastOutcome outcome={item.outcome} compact />
                      </td>

                      <td>
                        {hasDetailsPage ? (
                          <Link
                            className="history-table__details"
                            to={`/forecasts/${item.entityId}`}
                            aria-label={`Открыть прогноз ${entityName}`}
                          >
                            Подробнее →
                          </Link>
                        ) : (
                          <span className="history-table__unavailable">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
