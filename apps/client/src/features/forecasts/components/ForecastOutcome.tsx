import { EvaluationStatus } from "@ai-oracle/shared";

import type {
  ForecastHistoryOutcomeDto,
  ProjectForecastOutcomeDto,
} from "@ai-oracle/shared";

import { EmptyState } from "../components/EmptyState";

import "./ForecastOutcome.css";

interface ForecastOutcomeProps {
  outcome: ForecastHistoryOutcomeDto | ProjectForecastOutcomeDto | null;
  compact?: boolean;
}

const outcomeLabels: Record<EvaluationStatus, string> = {
  [EvaluationStatus.Correct]: "Верный",
  [EvaluationStatus.Incorrect]: "Неверный",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

function formatValue(value: number | null): string {
  return value === null ? "—" : numberFormatter.format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дата не определена";
  }

  return dateFormatter.format(date);
}

export function ForecastOutcome({
  outcome,
  compact = false,
}: ForecastOutcomeProps) {
  if (outcome === null) {
    return (
      <section
        className={`forecast-outcome${
          compact ? " forecast-outcome--compact" : ""
        }`}
        aria-label="Результат проверки прогноза"
      >
        {!compact ? (
          <div className="forecast-outcome__heading">
            <div>
              <p className="page__eyebrow">Проверка прогноза</p>
              <h2>Результат прогноза</h2>
            </div>

            <span
              className="forecast-outcome__status"
              data-outcome-status="PENDING"
            >
              Ожидает проверки
            </span>
          </div>
        ) : (
          <span
            className="forecast-outcome__status"
            data-outcome-status="PENDING"
          >
            Ожидает проверки
          </span>
        )}

        <EmptyState
          compact
          title="Прогноз ожидает проверки"
          description={
            compact
              ? "Результат появится после наступления целевой даты."
              : "Фактическое значение и результат появятся после наступления целевой даты и проверки прогноза на сервере."
          }
        />
      </section>
    );
  }

  return (
    <section
      className={`forecast-outcome${
        compact ? " forecast-outcome--compact" : ""
      }`}
      aria-label="Результат проверки прогноза"
    >
      {!compact ? (
        <div className="forecast-outcome__heading">
          <div>
            <p className="page__eyebrow">Проверка прогноза</p>
            <h2>Результат прогноза</h2>
          </div>

          <span
            className="forecast-outcome__status"
            data-outcome-status={outcome.status}
          >
            {outcomeLabels[outcome.status]}
          </span>
        </div>
      ) : (
        <span
          className="forecast-outcome__status"
          data-outcome-status={outcome.status}
        >
          {outcomeLabels[outcome.status]}
        </span>
      )}

      <dl className="forecast-outcome__values">
        <div>
          <dt>Ожидаемое значение</dt>
          <dd>{formatValue(outcome.expectedValue)}</dd>
        </div>

        <div>
          <dt>Фактическое значение</dt>
          <dd>{formatValue(outcome.actualValue)}</dd>
        </div>

        <div>
          <dt>Проверен</dt>
          <dd>
            <time dateTime={outcome.evaluatedAt}>
              {formatDate(outcome.evaluatedAt)}
            </time>
          </dd>
        </div>
      </dl>
    </section>
  );
}
