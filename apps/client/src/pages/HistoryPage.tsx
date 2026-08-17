import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import {
  DeveloperInterestPrediction,
  ForecastKind,
  ForecastStatus,
  ProjectPopularityPrediction,
} from "@ai-oracle/shared";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchEntities } from "../features/entities/entitiesSlice";
import { fetchForecastHistory } from "../features/history/historySlice";

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

export function HistoryPage() {
  const dispatch = useAppDispatch();
  const historyRequested = useRef(false);
  const entitiesRequested = useRef(false);

  const {
    items: history,
    loading: historyLoading,
    error: historyError,
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

  const entityNames = new Map(
    entities.map((entity) => [entity.id, entity.name]),
  );

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
        <div
          className="history-page__state history-page__state--empty"
          role="status"
        >
          История прогнозов пока пуста.
        </div>
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

          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th scope="col">Created</th>
                  <th scope="col">Entity</th>
                  <th scope="col">Prediction</th>
                  <th scope="col">Score</th>
                  <th scope="col">Confidence</th>
                  <th scope="col">Target</th>
                  <th scope="col">Status</th>
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
