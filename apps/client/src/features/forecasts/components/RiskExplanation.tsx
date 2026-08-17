import type {
  ProjectForecastRiskReasonDto,
  RiskLevel,
} from "@ai-oracle/shared";

import "./RiskExplanation.css";

interface RiskExplanationProps {
  risk: RiskLevel;
  reason: ProjectForecastRiskReasonDto;
}

export function RiskExplanation({ risk, reason }: RiskExplanationProps) {
  return (
    <section
      className="risk-explanation"
      data-risk={risk.toLowerCase()}
      aria-labelledby="risk-explanation-title"
    >
      <header className="risk-explanation__header">
        <div>
          <p className="risk-explanation__eyebrow">Risk analysis</p>
          <h2 id="risk-explanation-title">Risk Explanation</h2>
        </div>

        <span
          className="risk-explanation__level"
          data-risk={risk.toLowerCase()}
        >
          {risk}
        </span>
      </header>

      <div className="risk-explanation__content">
        <p className="risk-explanation__label">Основная причина уровня риска</p>

        <p className="risk-explanation__reason">{reason.message}</p>
      </div>
    </section>
  );
}
