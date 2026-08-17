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
  [EvaluationStatus.Correct]: "Correct",
  [EvaluationStatus.Incorrect]: "Incorrect",
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
              <p className="page__eyebrow">Forecast evaluation</p>
              <h2>Результат прогноза</h2>
            </div>

            <span
              className="forecast-outcome__status"
              data-outcome-status="PENDING"
            >
              Pending
            </span>
          </div>
        ) : (
          <span
            className="forecast-outcome__status"
            data-outcome-status="PENDING"
          >
            Pending
          </span>
        )}

        <EmptyState
          compact
          title="Прогноз ожидает проверки"
          description={
            compact
              ? "Результат появится после target date."
              : "Фактическое значение и результат проверки появятся после наступления target date и выполнения backend evaluation."
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
            <p className="page__eyebrow">Forecast evaluation</p>
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
          <dt>Expected</dt>
          <dd>{formatValue(outcome.expectedValue)}</dd>
        </div>

        <div>
          <dt>Actual</dt>
          <dd>{formatValue(outcome.actualValue)}</dd>
        </div>

        <div>
          <dt>Evaluated</dt>
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
