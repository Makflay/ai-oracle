import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchEntities } from "../features/entities/entitiesSlice";
import {
  fetchDeveloperInterestForecast,
  fetchProjectForecast,
} from "../features/forecasts/forecastSlice";

import { DeveloperInterestHeroCard } from "../features/forecasts/components/DeveloperInterestHeroCard";
import { ProjectForecastCard } from "../features/forecasts/components/ProjectForecastCard";
import { EmptyState } from "../features/forecasts/components/EmptyState";
import { ErrorState } from "../features/forecasts/components/ErrorState";

import "./HomePage.css";

const DEVELOPER_INTEREST_ENTITY_SLUG = "ai-developer-interest";

interface StateContainerProps {
  children: string;
  kind: "loading" | "error" | "empty";
}

function StateContainer({ children, kind }: StateContainerProps) {
  const role = kind === "error" ? "alert" : "status";

  return (
    <div className={`state-container state-container--${kind}`} role={role}>
      {children}
    </div>
  );
}

export function HomePage() {
  const dispatch = useAppDispatch();

  const {
    items: entities,
    loading: entitiesLoading,
    error: entitiesError,
  } = useAppSelector((state) => state.entities);

  const {
    projectForecasts,
    projectLoading,
    projectErrors,
    developerInterest,
    developerInterestLoading,
    developerInterestError,
  } = useAppSelector((state) => state.forecasts);

  const projectEntities = entities.filter(
    (entity) => entity.slug !== DEVELOPER_INTEREST_ENTITY_SLUG,
  );

  useEffect(() => {
    if (entities.length === 0 && !entitiesLoading && entitiesError === null) {
      void dispatch(fetchEntities());
    }
  }, [dispatch, entities.length, entitiesError, entitiesLoading]);

  useEffect(() => {
    if (
      developerInterest === null &&
      !developerInterestLoading &&
      developerInterestError === null
    ) {
      void dispatch(fetchDeveloperInterestForecast());
    }
  }, [
    developerInterest,
    developerInterestError,
    developerInterestLoading,
    dispatch,
  ]);

  useEffect(() => {
    if (entitiesLoading || entitiesError !== null) {
      return;
    }

    for (const entity of projectEntities) {
      const hasForecast = projectForecasts[entity.id] !== undefined;
      const isLoading = projectLoading[entity.id] ?? false;
      const hasError =
        projectErrors[entity.id] !== null &&
        projectErrors[entity.id] !== undefined;

      if (!hasForecast && !isLoading && !hasError) {
        void dispatch(fetchProjectForecast(entity.id));
      }
    }
  }, [
    dispatch,
    entitiesError,
    entitiesLoading,
    projectEntities,
    projectErrors,
    projectForecasts,
    projectLoading,
  ]);

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <p className="page__eyebrow">AI ecosystem outlook</p>
        <h1>Прогнозы AI-экосистемы</h1>
        <p>
          Объяснимые прогнозы Developer Interest и популярности AI-проектов на
          ближайшие 14 дней.
        </p>
      </header>

      <section
        className="dashboard-section"
        aria-labelledby="developer-interest-title"
      >
        <DeveloperInterestHeroCard />
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="project-forecasts-title"
      >
        <div className="dashboard-section__header">
          <div>
            <p className="dashboard-section__eyebrow">Project outlook</p>
            <h2 id="project-forecasts-title">Прогнозы проектов</h2>
          </div>

          <span className="dashboard-section__count">
            {projectEntities.length}
          </span>
        </div>

        {entitiesLoading && entities.length === 0 ? (
          <StateContainer kind="loading">
            Загружаем список AI-проектов…
          </StateContainer>
        ) : null}

        {entitiesError !== null ? (
          <ErrorState
            compact={entities.length > 0}
            title="Не удалось загрузить список AI-проектов"
            description={
              entities.length > 0
                ? "Показываем ранее загруженный список. Можно повторить запрос."
                : "Project forecasts недоступны без списка AI-проектов."
            }
            details={entitiesError}
            action={
              <button
                type="button"
                disabled={entitiesLoading}
                onClick={() => {
                  void dispatch(fetchEntities());
                }}
              >
                {entitiesLoading ? "Повторяем…" : "Повторить"}
              </button>
            }
          />
        ) : null}

        {!entitiesLoading &&
        entitiesError === null &&
        projectEntities.length === 0 ? (
          <EmptyState
            title="AI-проекты пока не добавлены"
            description="Backend не вернул ни одной project entity. Обновите список или вернитесь позже."
            action={
              <button
                type="button"
                onClick={() => {
                  void dispatch(fetchEntities());
                }}
              >
                Обновить список
              </button>
            }
          />
        ) : null}

        {projectEntities.length > 0 ? (
          <div className="project-forecast-grid">
            {projectEntities.map((entity) => (
              <ProjectForecastCard
                key={entity.id}
                entity={entity}
                forecast={projectForecasts[entity.id]}
                loading={projectLoading[entity.id] ?? false}
                error={projectErrors[entity.id] ?? null}
                onRetry={() => {
                  void dispatch(fetchProjectForecast(entity.id));
                }}
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
