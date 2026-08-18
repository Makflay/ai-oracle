import type { ProjectForecastRiskReasonDto } from "@ai-oracle/shared";

import { RiskLevel } from "@ai-oracle/shared";

import "./RiskExplanation.css";

interface RiskExplanationProps {
  risk: RiskLevel;
  reason: ProjectForecastRiskReasonDto;
}

const riskLabels: Record<RiskLevel, string> = {
  [RiskLevel.Low]: "НИЗКИЙ",
  [RiskLevel.Medium]: "СРЕДНИЙ",
  [RiskLevel.High]: "ВЫСОКИЙ",
};

export function RiskExplanation({ risk, reason }: RiskExplanationProps) {
  return (
    <section
      className="risk-explanation"
      data-risk={risk.toLowerCase()}
      aria-labelledby="risk-explanation-title"
    >
      <header className="risk-explanation__header">
        <div>
          <p className="risk-explanation__eyebrow">Анализ риска</p>
          <h2 id="risk-explanation-title">Объяснение риска</h2>
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
