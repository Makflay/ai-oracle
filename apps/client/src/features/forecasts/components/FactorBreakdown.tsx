import type { ProjectForecastFactorDto } from "@ai-oracle/shared";

import { EmptyState } from "./EmptyState";

import "./FactorBreakdown.css";

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

const sourceLabels: Readonly<Record<string, string>> = {
  hugging_face: "Hugging Face",
  hacker_news: "Hacker News",
  arxiv: "arXiv",
};

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatContribution(value: number): string {
  const formattedValue = formatNumber(value);

  return value > 0 ? `+${formattedValue}` : formattedValue;
}

function formatIdentifier(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSource(sourceKey: string): string {
  return sourceLabels[sourceKey] ?? formatIdentifier(sourceKey);
}

interface FactorBreakdownProps {
  factors: readonly ProjectForecastFactorDto[];
}

export function FactorBreakdown({ factors }: FactorBreakdownProps) {
  const totalContribution = factors.reduce(
    (total, factor) => total + factor.contribution,
    0,
  );

  return (
    <section
      className="factor-breakdown"
      aria-labelledby="factor-breakdown-title"
    >
      <header className="factor-breakdown__header">
        <div>
          <p className="factor-breakdown__eyebrow">Explainability</p>
          <h2 id="factor-breakdown-title">Factor Breakdown</h2>
        </div>

        {factors.length > 0 ? (
          <div className="factor-breakdown__total">
            <span>Сумма contributions</span>
            <strong>{formatContribution(totalContribution)}</strong>
          </div>
        ) : null}
      </header>

      {factors.length === 0 ? (
        <EmptyState
          compact
          title="Факторы отсутствуют"
          description="Backend не вернул factor breakdown для этого прогноза. Попробуйте обновить прогноз доступной кнопкой Refresh forecast."
        />
      ) : (
        <div className="factor-breakdown__table-container">
          <table className="factor-breakdown__table">
            <thead>
              <tr>
                <th scope="col">Источник / metric</th>
                <th scope="col">Raw value</th>
                <th scope="col">Normalized</th>
                <th scope="col">Weight</th>
                <th scope="col">Contribution</th>
              </tr>
            </thead>

            <tbody>
              {factors.map((factor) => (
                <tr key={factor.id}>
                  <th scope="row">
                    <span className="factor-breakdown__source">
                      {formatSource(factor.sourceKey)}
                    </span>

                    <span className="factor-breakdown__metric">
                      {formatIdentifier(factor.metricType)}
                    </span>
                  </th>

                  <td>{formatNumber(factor.rawValue)}</td>

                  <td>
                    <span className="factor-breakdown__normalized">
                      {formatNumber(factor.normalizedValue)}
                    </span>
                    <span className="factor-breakdown__scale">/100</span>
                  </td>

                  <td>{formatNumber(factor.weight)}</td>

                  <td>
                    <strong
                      className="factor-breakdown__contribution"
                      data-sign={
                        factor.contribution > 0
                          ? "positive"
                          : factor.contribution < 0
                            ? "negative"
                            : "neutral"
                      }
                    >
                      {formatContribution(factor.contribution)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <th scope="row" colSpan={4}>
                  Итоговая сумма contributions
                </th>

                <td>
                  <strong
                    className="factor-breakdown__contribution"
                    data-sign={
                      totalContribution > 0
                        ? "positive"
                        : totalContribution < 0
                          ? "negative"
                          : "neutral"
                    }
                  >
                    {formatContribution(totalContribution)}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
